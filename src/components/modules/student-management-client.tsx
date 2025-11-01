
"use client";

import { useWms } from "@/context/WmsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";

export function StudentManagementClient() {
  const { state, dispatch } = useWms();
  const { currentUserPermissions, users, classes, roles } = state;
  const { toast } = useToast();
  const [userToModify, setUserToModify] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  if (!currentUserPermissions?.canManageStudents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Vous n'avez pas les permissions pour gérer les élèves.</p>
        </CardContent>
      </Card>
    );
  }

  const students = Array.from(users.values()).filter(
    (user) => user.profile === "élève"
  );
  
  const studentRoles = Array.from(roles.values()).filter(r => r.isStudentRole);

  const handleRoleChange = (username: string, newRoleId: string) => {
    dispatch({ type: "UPDATE_STUDENT_ROLE", payload: { username, newRoleId } });
    toast({
        title: "Rôle mis à jour",
        description: `Le rôle de ${username} a été changé.`
    });
  };

  const handleDeleteUser = (username: string) => {
    dispatch({ type: "DELETE_USER", payload: { username } });
    toast({
        variant: "destructive",
        title: "Utilisateur supprimé",
        description: `L'utilisateur ${username} a été supprimé.`
    });
  }

  const handlePasswordReset = () => {
    if (!userToModify || !newPassword) return;
    dispatch({ type: 'RESET_USER_PASSWORD', payload: { username: userToModify.username, newPassword }});
    toast({
        title: "Mot de passe modifié",
        description: `Le mot de passe de ${userToModify.username} a été réinitialisé.`
    });
    setUserToModify(null);
    setNewPassword("");
  }


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Liste des Élèves</CardTitle>
          <CardDescription>
            Modifiez le rôle, réinitialisez le mot de passe ou supprimez des
            comptes élèves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifiant</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.username}>
                    <TableCell className="font-medium">
                      {student.username}
                    </TableCell>
                    <TableCell>
                      {student.classId ? classes.get(student.classId)?.name : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={student.roleId}
                        onValueChange={(newRoleId) =>
                          handleRoleChange(student.username, newRoleId)
                        }
                      >
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Changer le rôle..." />
                        </SelectTrigger>
                        <SelectContent>
                          {studentRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => setUserToModify(student)}><KeyRound className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Supprimer {student.username} ?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogDescription>Cette action est irréversible. Le compte et toutes les données associées seront supprimés.</AlertDialogDescription>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(student.username)}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun élève inscrit pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Password Reset Dialog */}
      <Dialog open={!!userToModify} onOpenChange={() => setUserToModify(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Réinitialiser le mot de passe pour {userToModify?.username}</DialogTitle>
                <DialogDescription>Entrez le nouveau mot de passe.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input id="newPassword" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost" onClick={() => setUserToModify(null)}>Annuler</Button></DialogClose>
                <Button onClick={handlePasswordReset}>Enregistrer</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
