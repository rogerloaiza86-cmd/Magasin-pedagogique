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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Boxes } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/lib/types";

type SignUpFormData = {
  username: string;
  password: string;
  confirmPassword: string;
  profile: UserProfile;
  classId: string;
};

export default function SignUpPage() {
  const { state, dispatch } = useWms();
  const router = useRouter();
  const { toast } = useToast();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      profile: "élève",
      classId: "",
    },
  });

  const password = watch("password");
  const profile = watch("profile");
  const classes = Array.from(state.classes.values());

  const onSubmit = (data: SignUpFormData) => {
    try {
      const payload: any = { 
            username: data.username, 
            password: data.password, 
            profile: data.profile 
      };
      if (data.profile === 'élève') {
        payload.classId = parseInt(data.classId, 10);
      }
      dispatch({ 
        type: 'REGISTER_USER', 
        payload
      });
      toast({
        title: "Compte créé",
        description: "Vous pouvez maintenant vous connecter."
      })
      router.push("/login");
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erreur d'inscription",
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
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription>
              Remplissez le formulaire pour vous inscrire.
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
                  rules={{ required: "Le mot de passe est requis", minLength: { value: 4, message: "Le mot de passe doit contenir au moins 4 caractères"} }}
                  render={({ field }) => <Input id="password" type="password" {...field} />}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
               <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Controller
                  name="confirmPassword"
                  control={control}
                  rules={{ 
                    required: "Veuillez confirmer le mot de passe",
                    validate: value => value === password || "Les mots de passe ne correspondent pas"
                  }}
                  render={({ field }) => <Input id="confirmPassword" type="password" {...field} />}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
               <div>
                <Label htmlFor="profile">Profil</Label>
                 <Controller
                    name="profile"
                    control={control}
                    rules={{ required: "Le profil est requis" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="profile">
                            <SelectValue placeholder="Sélectionner un profil..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="élève">Élève</SelectItem>
                            <SelectItem value="professeur">Professeur</SelectItem>
                            <SelectItem value="Administrateur">Administrateur</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                    />
                {errors.profile && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.profile.message}
                  </p>
                )}
              </div>

              {profile === 'élève' && (
                <div>
                    <Label htmlFor="classId">Classe</Label>
                    <Controller
                        name="classId"
                        control={control}
                        rules={{ required: "La classe est requise pour un élève" }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="classId">
                                    <SelectValue placeholder="Sélectionner une classe..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.classId && (
                        <p className="text-sm text-destructive mt-1">
                            {errors.classId.message}
                        </p>
                    )}
                </div>
              )}

              <Button type="submit" className="w-full">
                S'inscrire
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                Déjà un compte?{" "}
                <Link href="/login" className="underline">
                    Se connecter
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
