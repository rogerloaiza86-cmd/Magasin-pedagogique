
"use client";

import { useWms } from "@/context/WmsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, PlusCircle, Trash2 } from "lucide-react";
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

type ClassFormData = {
    name: string;
}

function CreateClassForm() {
    const { dispatch } = useWms();
    const { toast } = useToast();
    const { control, handleSubmit, reset, formState: { errors } } = useForm<ClassFormData>({
        defaultValues: { name: "" }
    });

    const onSubmit = (data: ClassFormData) => {
        dispatch({ type: "ADD_CLASS", payload: { name: data.name } });
        toast({
            title: "Classe créée",
            description: `La classe "${data.name}" a été ajoutée.`,
        });
        reset();
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Créer une nouvelle classe</CardTitle>
                <CardDescription>Ajoutez une nouvelle classe ou un nouveau groupe. Vous y serez automatiquement assigné si vous êtes professeur.</CardDescription>
            </CardHeader>
             <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent>
                    <Label htmlFor="name">Nom de la classe</Label>
                    <div className="flex gap-2">
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: "Le nom de la classe est requis" }}
                            render={({ field }) => <Input id="name" placeholder="Ex: 2GATL1 A" {...field} />}
                        />
                        <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />Créer</Button>
                    </div>
                     {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </CardContent>
             </form>
        </Card>
    );
}

export function ClassesClient() {
  const { state, dispatch } = useWms();
  const { classes, users, currentUser } = state;
  const { toast } = useToast();
  const [openClassId, setOpenClassId] = useState<number | null>(null);

  const handleToggleAssignment = (classId: number) => {
    if (currentUser?.profile === "professeur") {
      dispatch({
        type: "TOGGLE_TEACHER_CLASS_ASSIGNMENT",
        payload: {
          classId: classId,
          teacherId: currentUser.username,
        },
      });
      
      const classInfo = classes.get(classId);
      const isAssigned = classInfo?.teacherIds?.includes(currentUser.username);

      toast({
        title: isAssigned ? "Désassignation réussie" : "Assignation réussie",
        description: `Vous avez ${isAssigned ? 'quitté' : 'rejoint'} la classe ${classInfo?.name}.`,
      });
    }
  };

  const handleDeleteClass = (classId: number) => {
    const classInfo = classes.get(classId);
    dispatch({ type: 'DELETE_CLASS', payload: { classId } });
    toast({
        variant: "destructive",
        title: "Classe supprimée",
        description: `La classe "${classInfo?.name}" a été supprimée.`
    })
  }

  const getStudentsInClass = (classId: number): User[] => {
    return Array.from(users.values()).filter(
      (user) => user.profile === "élève" && user.classId === classId
    );
  };
  
  const getTeachersForClass = (classId: number): User[] => {
    const classInfo = classes.get(classId);
    if (!classInfo || !classInfo.teacherIds) return [];
    return classInfo.teacherIds.map(teacherId => users.get(teacherId)).filter(Boolean) as User[];
  }

  const sortedClasses = Array.from(classes.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      {(currentUser?.profile === "professeur" || currentUser?.profile === "Administrateur") && (
        <>
            <CreateClassForm />
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Classes</CardTitle>
                    <CardDescription>
                    {currentUser.profile === 'professeur' 
                        ? "Assignez-vous aux classes que vous supervisez et consultez la liste des élèves." 
                        : "Vue d'ensemble de toutes les classes, des professeurs assignés et des élèves."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sortedClasses.length > 0 ? sortedClasses.map(c => {
                    const isTeacherAssigned = currentUser?.profile === 'professeur' && c.teacherIds?.includes(currentUser.username);
                    const teachers = getTeachersForClass(c.id);

                    return (
                        <Collapsible key={c.id} open={openClassId === c.id} onOpenChange={() => setOpenClassId(prev => prev === c.id ? null : c.id)}>
                        <div className="border p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{c.name}</h3>
                                <div className="text-xs text-muted-foreground flex gap-1 flex-wrap mt-1">
                                {teachers.map(t => <Badge key={t.username} variant="secondary">{t.username}</Badge>)}
                                {teachers.length === 0 && <Badge variant="outline">Aucun professeur</Badge>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {currentUser?.profile === 'professeur' && (
                                    <Button 
                                    variant={isTeacherAssigned ? 'outline' : 'default'}
                                    size="sm" 
                                    onClick={(e) => { e.stopPropagation(); handleToggleAssignment(c.id); }}
                                    >
                                    {isTeacherAssigned ? 'Quitter la classe' : 'Gérer cette classe'}
                                    </Button>
                                )}
                                {currentUser?.profile === 'Administrateur' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" onClick={(e) => e.stopPropagation()}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Voulez-vous vraiment supprimer cette classe ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible. La classe "{c.name}" sera supprimée. Les élèves de cette classe ne seront plus assignés.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteClass(c.id)}>Supprimer</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                                <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                                    <span className="sr-only">Toggle</span>
                                </Button>
                                </CollapsibleTrigger>
                            </div>
                            </div>
                            <CollapsibleContent className="mt-4">
                            <StudentListTable students={getStudentsInClass(c.id)} />
                            </CollapsibleContent>
                        </div>
                        </Collapsible>
                    )
                    }) : (
                        <div className="text-center text-muted-foreground py-8">
                            Aucune classe n'a été créée pour le moment.
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
      )}
    </div>
  );
}

function StudentListTable({ students }: { students: User[] }) {
    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Identifiant de l'élève</TableHead>
                    <TableHead>Profil</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.length > 0 ? (
                students.map((student) => (
                    <TableRow key={student.username}>
                    <TableCell className="font-medium">{student.username}</TableCell>
                    <TableCell><Badge variant="outline">{student.profile}</Badge></TableCell>
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                    Aucun élève n'est encore inscrit dans cette classe.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
