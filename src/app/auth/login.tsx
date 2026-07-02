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

const loginSchema = z.object({
  telephone: z
    .string()
    .min(8, "Numéro trop court")
    .regex(/^\+?[0-9\s]{8,20}$/, "Numéro invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginInput = z.infer<typeof loginSchema>;

interface AuthResponse {
  client: ClientSession;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await apiFetch<AuthResponse>(ENDPOINTS.authClientLogin, {
        method: "POST",
        body: JSON.stringify(data),
      });

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
          Connexion
        </Text>
        <Text className="text-gray-500 mb-8">
          Connectez-vous pour accéder à vos commandes
        </Text>

        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Téléphone</Text>
          <Controller
            control={control}
            name="telephone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-xl p-4 text-base bg-gray-50 ${errors.telephone ? "border-red-500" : "border-gray-200"
                  }`}
                placeholder="+225 07 00 00 00"
                keyboardType="phone-pad"
                autoCapitalize="none"
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
          <Text className="text-gray-700 font-medium mb-2">Mot de passe</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-xl p-4 text-base bg-gray-50 ${errors.password ? "border-red-500" : "border-gray-200"
                  }`}
                placeholder="••••••••"
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
              Se connecter
            </Text>
          )}
        </TouchableOpacity>

        <View className="items-center py-4">
          <Link href="/auth/register" className="mb-4">
            <Text className="text-brand-600 font-medium text-base">
              Pas encore de compte ?{" "}
              <Text className="underline">S'inscrire</Text>
            </Text>
          </Link>

          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-gray-500 text-sm underline">
              Commander sans compte
            </Text>
          </TouchableOpacity>
        </View>

        <View className="pb-8" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
