import { ENDPOINTS } from "@/constants/api";
import { resolveAuthRedirect } from "@/domain/authRedirect";
import { apiFetch } from "@/lib/api";
import { authDataSchema, parseApiSuccess } from "@/lib/apiValidation";
import { useStore } from "@/store";
import type { AuthResponse } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, Eye, EyeOff, Lock } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const loginSchema = z.object({
  telephone: z
    .string()
    .min(8, "Numéro trop court")
    .regex(/^[0-9\s]{8,20}$/, "Numéro invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { telephone: "", password: "" },
  });

  const setClient = useStore((s) => s.setClient);
  const router = useRouter();
  const { redirectTo, resumeCheckout } = useLocalSearchParams<{
    redirectTo?: string;
    resumeCheckout?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Le champ ne contient que le numéro local, on préfixe l'indicatif ici
      const telephoneComplet = `+225${data.telephone.replace(/\s/g, "")}`;

      const payload = await apiFetch<unknown>(ENDPOINTS.authClientLogin, {
        method: "POST",
        body: JSON.stringify({
          telephone: telephoneComplet,
          password: data.password,
          tokenTransport: "json",
        }),
        skipAuth: true,
      });
      const response = parseApiSuccess<AuthResponse["data"]>(
        payload,
        authDataSchema,
        "auth/login",
      );

      const { client, tokens } = response.data;
      await setClient(client, tokens.accessToken, tokens.refreshToken);
      const destination = resolveAuthRedirect(redirectTo);

      if (
        destination === "/panier" &&
        resumeCheckout === "1"
      ) {
        router.replace({
          pathname: "/panier",
          params: { resumeCheckout: "1" },
        });
      } else {
        router.replace(destination);
      }
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // const handleGoogle = async () => {
  //   // 🔗 Flux OAuth Google -> échange du token avec ENDPOINTS.authClientGoogle (à confirmer sur l'OpenAPI)
  //   setServerError("La connexion Google sera disponible prochainement.");
  // };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-ink-100"
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        className="flex-1 bg-ink-100"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="items-center -mt-9">
          <View className="items-center justify-center h-28 w-full">
            <Image
              source={require("@/assets/images/toutci-logo-transparent.png")}
              resizeMode="contain"
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        </View>

        {/* Illustration */}
        <View className="items-center justify-center mt-6 mb-2 h-40">
          <Image
            source={require("@/assets/images/login-illustration.jpeg")}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        {/* Titre */}
        <View className="items-center px-8 mt-2">
          <Text className="text-2xl font-extrabold text-black">
            Bon retour !
          </Text>
          <Text className="text-gray-400 text-center mt-2 leading-5">
            Connectez-vous pour découvrir les meilleurs établissements autour de
            vous.
          </Text>
        </View>

        {/* Formulaire */}
        <View className="px-6 mt-8">
          {/* Téléphone */}
          <Text className="text-black font-semibold mb-2">Téléphone</Text>
          <Controller
            control={control}
            name="telephone"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-2xl h-14 px-4 ${
                  errors.telephone ? "border-red-500" : "border-gray-200"
                }`}
              >
                <Text className="text-lg mr-1">🇨🇮</Text>
                <Text className="text-black font-medium ml-1">+225</Text>
                <ChevronDown
                  size={16}
                  color="#9ca3af"
                  style={{ marginLeft: 4 }}
                />
                <View className="w-px h-6 bg-gray-200 mx-3" />
                <TextInput
                  className="flex-1 text-black text-base"
                  placeholder="07 51 23 45 67"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.telephone && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.telephone.message}
            </Text>
          )}

          {/* Mot de passe */}
          <Text className="text-black font-semibold mb-2 mt-5">
            Mot de passe
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-2xl h-14 px-4 ${
                  errors.password ? "border-red-500" : "border-gray-200"
                }`}
              >
                <Lock size={18} color="#14532d" />
                <TextInput
                  className="flex-1 text-black text-base ml-3"
                  placeholder="Entrez votre mot de passe"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#14532d" />
                  ) : (
                    <Eye size={18} color="#14532d" />
                  )}
                </Pressable>
              </View>
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </Text>
          )}

          {serverError && (
            <View className="mt-2 mb-2 p-4 bg-red-50 rounded-2xl border border-red-200">
              <Text className="text-red-600 text-center">{serverError}</Text>
            </View>
          )}

          {/* Bouton Se connecter */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className={`rounded-2xl h-14 items-center justify-center mt-4 ${
              isLoading ? "bg-green-900/70" : "bg-green-900"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Se connecter
              </Text>
            )}
          </TouchableOpacity>

          {/* Créer un compte */}
          <View className="items-center mt-8 mb-14">
            <Text className="text-gray-500">Vous n&apos;avez pas de compte ?</Text>
            <Link
              href={{
                pathname: "/auth/register",
                params: {
                  redirectTo:
                    typeof redirectTo === "string" ? redirectTo : undefined,
                  resumeCheckout:
                    typeof resumeCheckout === "string"
                      ? resumeCheckout
                      : undefined,
                },
              }}
            >
              <Text className="text-green-800 font-semibold mt-1">
                Créer un compte
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
