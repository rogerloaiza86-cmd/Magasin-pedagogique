
"use client";

import { useWms } from "@/context/WmsContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { useToast } from "@/hooks/use-toast";

type LoginFormData = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const { dispatch } = useWms();
  const router = useRouter();
  const { toast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    try {
      dispatch({ type: "LOGIN", payload: data });
      router.push("/dashboard");
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: error.message,
        })
    }
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
              Entrez votre identifiant et mot de passe pour continuer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="username">Identifiant</Label>
                <Controller
                  name="username"
                  control={control}
                  rules={{ required: "L'identifiant est requis" }}
                  render={({ field }) => <Input id="username" {...field} />}
                />
                {errors.username && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: "Le mot de passe est requis" }}
                  render={({ field }) => <Input id="password" type="password" {...field} />}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                Pas encore de compte?{" "}
                <Link href="/signup" className="underline">
                    Créer un compte
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
