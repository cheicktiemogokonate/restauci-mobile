import { ENDPOINTS } from "@/constants/api";
import { resolveAuthRedirect } from "@/domain/authRedirect";
import { apiFetch } from "@/lib/api";
import { authDataSchema, parseApiSuccess } from "@/lib/apiValidation";
import { useStore } from "@/store";
import type { AuthResponse } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react-native";
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

const registerSchema = z
  .object({
    nom: z.string().min(2, "Nom trop court").max(255),
    telephone: z
      .string()
      .regex(/^[0-9\s]{8,20}$/, "Numéro de téléphone invalide"),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    password: z.string().min(8, "8 caractères minimum").max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nom: "",
      telephone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Le champ ne contient que le numéro local, on préfixe l'indicatif ici
      const telephoneComplet = `+225${data.telephone.replace(/\s/g, "")}`;

      const body: Record<string, string> = {
        nom: data.nom,
        telephone: telephoneComplet,
        password: data.password,
        tokenTransport: "json",
      };
      if (data.email) body.email = data.email;

      const payload = await apiFetch<unknown>(ENDPOINTS.authClientRegister, {
        method: "POST",
        body: JSON.stringify(body),
        skipAuth: true,
      });
      const response = parseApiSuccess<AuthResponse["data"]>(
        payload,
        authDataSchema,
        "auth/register",
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#ffffff]"
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        className="flex-1 bg-[#ffffff]"
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

        <View className="items-center justify-center mt-4 mb-2 h-48">
          <Image
            source={require("@/assets/images/inscription-illustration.jpeg")}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        {/* Titre */}
        <View className="items-center px-8 mt-2">
          <Text className="text-2xl font-extrabold text-black">
            Créer un compte
          </Text>
          <Text className="text-gray-400 text-center mt-2 leading-5">
            Rejoignez Toutci et découvrez les meilleurs établissements autour de
            vous.
          </Text>
        </View>

        {/* Formulaire */}
        <View className="px-6 mt-7">
          {/* Nom complet */}
          <Text className="text-black font-semibold mb-2">Nom complet</Text>
          <Controller
            control={control}
            name="nom"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-2xl h-14 px-4 ${
                  errors.nom ? "border-red-500" : "border-gray-200"
                }`}
              >
                <User size={18} color="#14532d" />
                <TextInput
                  className="flex-1 text-black text-base ml-3"
                  placeholder="Entrez votre nom complet"
                  //   placeholderTextColor="#14532d"
                  autoCapitalize="words"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.nom && (
            <Text className="text-red-500 text-sm mt-1 mb-1">
              {errors.nom.message}
            </Text>
          )}

          {/* Téléphone */}
          <Text className="text-black font-semibold mb-2 mt-4">Téléphone</Text>
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
                  color="#14532d"
                  style={{ marginLeft: 4 }}
                />
                <View className="w-px h-6 bg-gray-200 mx-3" />
                <TextInput
                  className="flex-1 text-black text-base"
                  placeholder="07 51 23 45 67"
                  //   placeholderTextColor="#14532d"
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.telephone && (
            <Text className="text-red-500 text-sm mt-1 mb-1">
              {errors.telephone.message}
            </Text>
          )}

          {/* Email optionnel */}
          <Text className="text-black font-semibold mb-2 mt-4">
            Email (optionnel)
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-2xl h-14 px-4 ${
                  errors.email ? "border-red-500" : "border-gray-200"
                }`}
              >
                <Mail size={18} color="#14532d" />
                <TextInput
                  className="flex-1 text-black text-base ml-3"
                  placeholder="Entrez votre email"
                  //   placeholderTextColor="#14532d"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.email && (
            <Text className="text-red-500 text-sm mt-1 mb-1">
              {errors.email.message}
            </Text>
          )}

          {/* Mot de passe */}
          <Text className="text-black font-semibold mb-2 mt-4">
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
                  placeholder="Créez un mot de passe"
                  //   placeholderTextColor="#14532d"
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
            <Text className="text-red-500 text-sm mt-1 mb-1">
              {errors.password.message}
            </Text>
          )}

          {/* Confirmer le mot de passe */}
          <Text className="text-black font-semibold mb-2 mt-4">
            Confirmer le mot de passe
          </Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-2xl h-14 px-4 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-200"
                }`}
              >
                <Lock size={18} color="#14532d" />
                <TextInput
                  className="flex-1 text-black text-base ml-3"
                  placeholder="Confirmez votre mot de passe"
                  //     //   placeholderTextColor="#14532d"
                  secureTextEntry={!showConfirmPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  hitSlop={10}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#14532d" />
                  ) : (
                    <Eye size={18} color="#14532d" />
                  )}
                </Pressable>
              </View>
            )}
          />
          {errors.confirmPassword && (
            <Text className="text-red-500 text-sm mt-1 mb-1">
              {errors.confirmPassword.message}
            </Text>
          )}

          {serverError && (
            <View className="mt-3 mb-2 p-4 bg-red-50 rounded-2xl border border-red-200">
              <Text className="text-red-600 text-center">{serverError}</Text>
            </View>
          )}

          {/* Bouton Créer mon compte */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className={`rounded-2xl h-14 items-center justify-center mt-6 ${
              isLoading ? "bg-brand-700/70" : "bg-brand-700"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Créer mon compte
              </Text>
            )}
          </TouchableOpacity>

          {/* Se connecter */}
          <View className="items-center mt-8 mb-14">
            <Text className="text-gray-500">Vous avez déjà un compte ?</Text>
            <Link
              href={{
                pathname: "/auth/login",
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
              <Text className="text-brand-700 font-semibold mt-1">
                Se connecter
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
