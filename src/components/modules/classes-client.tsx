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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, Class } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function ClassesClient() {
  const { state, dispatch } = useWms();
  const { classes, users, currentUser } = state;
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const handleAssignClass = (classId: string) => {
    if (currentUser?.profile === "professeur") {
      dispatch({
        type: "ASSIGN_TEACHER_TO_CLASS",
        payload: {
          classId: parseInt(classId, 10),
          teacherId: currentUser.username,
        },
      });
      toast({
        title: "Classe assignée",
        description: `Vous avez été assigné à la classe.`,
      });
    }
  };

  const getStudentsInClass = (classId: number): User[] => {
    return Array.from(users.values()).filter(
      (user) => user.profile === "élève" && user.classId === classId
    );
  };
  
  const getTeacherClass = (): Class | undefined => {
    if (currentUser?.profile !== 'professeur') return undefined;
    return Array.from(classes.values()).find(c => c.teacherId === currentUser.username);
  }

  const teacherClass = getTeacherClass();

  return (
    <div className="space-y-6">
      {currentUser?.profile === "professeur" && !teacherClass && (
        <Card>
          <CardHeader>
            <CardTitle>S'assigner à une classe</CardTitle>
            <CardDescription>
              Sélectionnez la classe que vous supervisez pour voir la liste des
              élèves.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Select onValueChange={setSelectedClassId} value={selectedClassId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Sélectionner une classe..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from(classes.values()).map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()} disabled={!!c.teacherId}>
                    {c.name} {c.teacherId && `(déjà assignée)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleAssignClass(selectedClassId)}
              disabled={!selectedClassId}
            >
              Confirmer
            </Button>
          </CardContent>
        </Card>
      )}

      {teacherClass && (
        <Card>
            <CardHeader>
                <CardTitle>Votre Classe: {teacherClass.name}</CardTitle>
                <CardDescription>Liste des élèves inscrits dans votre classe.</CardDescription>
            </CardHeader>
            <CardContent>
                <StudentListTable students={getStudentsInClass(teacherClass.id)} />
            </CardContent>
        </Card>
      )}

      {currentUser?.profile === "Administrateur" && (
         <Card>
            <CardHeader>
                <CardTitle>Vue Administrateur</CardTitle>
                <CardDescription>Liste de toutes les classes et des élèves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {Array.from(classes.values()).map(c => (
                    <div key={c.id}>
                        <h3 className="font-bold text-lg mb-2">{c.name}</h3>
                        <div className="border rounded-lg">
                           <StudentListTable 
                                students={getStudentsInClass(c.id)} 
                                teacher={c.teacherId ? state.users.get(c.teacherId) : undefined}
                           />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      )}
    </div>
  );
}

function StudentListTable({ students, teacher }: { students: User[], teacher?: User }) {
    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Identifiant de l'élève</TableHead>
                    <TableHead>Profil</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {teacher && (
                    <TableRow className="bg-muted/50">
                        <TableCell className="font-medium">{teacher.username} <Badge variant="secondary">Professeur</Badge></TableCell>
                        <TableCell>{teacher.profile}</TableCell>
                    </TableRow>
                )}
                {students.length > 0 ? (
                students.map((student) => (
                    <TableRow key={student.username}>
                    <TableCell className="font-medium">{student.username}</TableCell>
                    <TableCell>{student.profile}</TableCell>
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
