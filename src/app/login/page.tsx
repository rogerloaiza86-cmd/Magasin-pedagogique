"use client";

import { useWms } from "@/context/WmsContext";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Boxes } from "lucide-react";

type LoginFormData = {
  firstName: string;
  lastName: string;
};

export default function LoginPage() {
  const { dispatch } = useWms();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    const fullName = `${data.firstName} ${data.lastName}`;
    dispatch({ type: "LOGIN", payload: fullName });
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
         <div className="flex items-center justify-center gap-2 p-2 mb-4">
              <Boxes className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Magasin Pédagogique</h1>
                <p className="text-sm text-muted-foreground">Lycée Gaspard Monge</p>
              </div>
            </div>
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Veuillez entrer votre nom et prénom pour continuer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: "Le prénom est requis" }}
                  render={({ field }) => <Input id="firstName" {...field} />}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: "Le nom est requis" }}
                  render={({ field }) => <Input id="lastName" {...field} />}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
