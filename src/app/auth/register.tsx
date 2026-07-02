import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/store";
import { ClientSession } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

const registerSchema = z
  .object({
    nom: z.string().min(2, "Nom trop court").max(255),
    telephone: z
      .string()
      .regex(/^\+?[0-9\s]{8,20}$/, "Numéro de téléphone invalide"),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    password: z
      .string()
      .min(6, "6 caractères minimum")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

interface AuthResponse {
  client: ClientSession;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const body: Record<string, string> = {
        nom: data.nom,
        telephone: data.telephone,
        password: data.password,
      };
      if (data.email) body.email = data.email;

      const result = await apiFetch<AuthResponse>(
        ENDPOINTS.authClientRegister,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      setClient(result.client, result.tokens.accessToken);
      router.back();
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

  const fieldStyle = (hasError: boolean) =>
    `border rounded-xl p-4 text-base bg-gray-50 ${hasError ? "border-red-500" : "border-gray-200"
    }`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1 px-6 pt-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-brand-600 mb-2">
          Inscription
        </Text>
        <Text className="text-gray-500 mb-8">
          Créez votre compte pour commander facilement
        </Text>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Nom complet
          </Text>
          <Controller
            control={control}
            name="nom"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={fieldStyle(!!errors.nom)}
                placeholder="Votre nom"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.nom && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.nom.message}
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Téléphone</Text>
          <Controller
            control={control}
            name="telephone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={fieldStyle(!!errors.telephone)}
                placeholder="+225 07 00 00 00"
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.telephone && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.telephone.message}
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Email <Text className="text-gray-400 font-normal">(optionnel)</Text>
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={fieldStyle(!!errors.email)}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Mot de passe</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={fieldStyle(!!errors.password)}
                placeholder="6 caractères minimum"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">
            Confirmer le mot de passe
          </Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={fieldStyle(!!errors.confirmPassword)}
                placeholder="Retapez le mot de passe"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.confirmPassword && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </Text>
          )}
        </View>

        {serverError && (
          <View className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
            <Text className="text-red-600 text-center">{serverError}</Text>
          </View>
        )}

        <TouchableOpacity
          className={`rounded-xl p-4 mb-4 ${isLoading ? "bg-brand-600/70" : "bg-brand-500"
            }`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-center text-lg">
              Créer mon compte
            </Text>
          )}
        </TouchableOpacity>

        <View className="items-center py-4">
          <Link href="/auth/login">
            <Text className="text-brand-600 font-medium text-base">
              Déjà un compte ?{" "}
              <Text className="underline">Se connecter</Text>
            </Text>
          </Link>
        </View>

        <View className="pb-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
