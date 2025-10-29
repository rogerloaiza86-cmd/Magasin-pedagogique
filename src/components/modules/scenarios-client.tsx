

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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { PlusCircle, Trash2, Swords, Rocket, Play } from "lucide-react";
import type { ScenarioTemplate, TaskType } from "@/lib/types";
import { Badge } from "../ui/badge";

const taskTypeLabels: Record<TaskType, string> = {
    CREATE_TIERS_CLIENT: 'Créer un client',
    CREATE_TIERS_FOURNISSEUR: 'Créer un fournisseur',
    CREATE_TIERS_TRANSPORTEUR: 'Créer un transporteur',
    CREATE_BC: 'Créer un Bon de Commande',
    RECEIVE_BC: 'Réceptionner un BC',
    CREATE_BL: 'Créer un Bon de Livraison',
    PREPARE_BL: 'Préparer un BL',
    SHIP_BL: 'Expédier un BL',
    MANUAL_VALIDATION: 'Validation manuelle',
};


function ScenarioTemplateForm({ template, onSave, onCancel }: { template?: ScenarioTemplate, onSave: (data: any) => void, onCancel: () => void }) {
  const { state } = useWms();
  const { control, handleSubmit, register, formState: { errors } } = useForm<Omit<ScenarioTemplate, 'id' | 'createdBy' | 'environnementId'>>({
    defaultValues: template ? {
        title: template.title,
        description: template.description,
        competences: template.competences,
        rolesRequis: template.rolesRequis,
        tasks: template.tasks
    } : {
      title: "",
      description: "",
      competences: [],
      rolesRequis: [],
      tasks: [{ taskOrder: 1, description: "", roleId: "", taskType: "MANUAL_VALIDATION" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "tasks" });
  const studentRoles = Array.from(state.roles.values()).filter(r => r.isStudentRole);

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
      <div>
        <Label>Titre du scénario</Label>
        <Input {...register("title", { required: "Le titre est requis" })} />
        {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
      </div>
      <div>
        <Label>Description</Label>
        <Textarea {...register("description")} />
      </div>
      <div>
        <Label>Compétences visées (séparées par des virgules)</Label>
        <Input {...register("competences", { setValueAs: v => typeof v === 'string' ? v.split(',').map(c => c.trim()) : v })} />
      </div>
       <div>
        <Label>Rôles requis pour ce scénario</Label>
        <Controller
            name="rolesRequis"
            control={control}
            render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 p-2 border rounded-md">
                    {studentRoles.map(role => (
                        <label key={role.id} className="flex items-center gap-2">
                            <input type="checkbox" value={role.id} checked={field.value.includes(role.id)}
                                onChange={(e) => {
                                    const newRoles = e.target.checked
                                        ? [...field.value, role.id]
                                        : field.value.filter(id => id !== role.id);
                                    field.onChange(newRoles);
                                }}
                             />
                            {role.name}
                        </label>
                    ))}
                </div>
            )}
        />
      </div>

      <div className="space-y-2">
        <Label>Tâches du scénario</Label>
        {fields.map((field, index) => (
          <div key={field.id} className="p-3 border rounded-lg space-y-2 bg-muted/50">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Tâche #{index + 1}</h4>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
             <Input {...register(`tasks.${index}.taskOrder`)} type="hidden" value={index + 1} />
             <Textarea {...register(`tasks.${index}.description`, { required: true })} placeholder="Description de la tâche..."/>

            <div className="grid grid-cols-3 gap-2">
                 <div>
                    <Label>Type de tâche</Label>
                    <Controller
                        name={`tasks.${index}.taskType`}
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {Object.entries(taskTypeLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                 </div>
                 <div>
                    <Label>Rôle assigné</Label>
                    <Controller
                        name={`tasks.${index}.roleId`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value.toString()}>
                            <SelectTrigger><SelectValue placeholder="Choisir..."/></SelectTrigger>
                            <SelectContent>
                                {studentRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                 </div>
                  <div>
                    <Label>Prérequis (Tâche #)</Label>
                    <Input type="number" {...register(`tasks.${index}.prerequisite`, { valueAsNumber: true })} placeholder="Optionnel"/>
                  </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => append({ taskOrder: fields.length + 1, description: "", roleId: "", taskType: "MANUAL_VALIDATION" })}>
          <PlusCircle className="mr-2" /> Ajouter une tâche
        </Button>
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </DialogFooter>
    </form>
  );
}


export function ScenariosClient() {
  const { state, dispatch } = useWms();
  const { currentUserPermissions, scenarioTemplates, classes, currentEnvironmentId } = state;
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScenarioTemplate | undefined>(undefined);
  const [launchingTemplate, setLaunchingTemplate] = useState<ScenarioTemplate | undefined>(undefined);
  const [selectedClass, setSelectedClass] = useState("");

  if (!currentUserPermissions?.canManageScenarios) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Vous n'avez pas les permissions nécessaires pour gérer les scénarios.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const handleSaveTemplate = (data: Omit<ScenarioTemplate, 'id' | 'createdBy' | 'environnementId'>) => {
    dispatch({ type: 'SAVE_SCENARIO_TEMPLATE', payload: { ...data, id: editingTemplate?.id }});
    toast({ title: "Scénario enregistré", description: `Le modèle "${data.title}" a été sauvegardé.`});
    setIsFormOpen(false);
    setEditingTemplate(undefined);
  }
  
  const handleLaunchScenario = () => {
    if (!launchingTemplate || !selectedClass) {
        toast({variant: 'destructive', title: "Erreur", description: "Veuillez sélectionner une classe."});
        return;
    }
    dispatch({type: 'LAUNCH_SCENARIO', payload: { templateId: launchingTemplate.id, classId: parseInt(selectedClass) }});
    toast({title: "Scénario lancé!", description: `Le scénario "${launchingTemplate.title}" a été lancé pour la classe sélectionnée.`});
    setLaunchingTemplate(undefined);
    setSelectedClass("");
  }
  
  const handleDeleteTemplate = (templateId: number) => {
    dispatch({ type: 'DELETE_SCENARIO_TEMPLATE', payload: { templateId } });
    toast({ variant: 'destructive', title: "Modèle supprimé" });
  }

  const templates = Array.from(scenarioTemplates.values()).filter(t => t.environnementId === currentEnvironmentId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle>Bibliothèque de Scénarios</CardTitle>
            <CardDescription>
              Créez, modifiez et lancez des scénarios pour vos classes dans cet environnement.
            </CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTemplate(undefined); setIsFormOpen(true); }}><PlusCircle className="mr-2"/>Nouveau Modèle</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{editingTemplate ? 'Modifier' : 'Créer'} un modèle de scénario</DialogTitle>
                </DialogHeader>
                <ScenarioTemplateForm 
                    template={editingTemplate} 
                    onSave={handleSaveTemplate}
                    onCancel={() => { setIsFormOpen(false); setEditingTemplate(undefined); }}
                />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length > 0 ? templates.map(template => (
                <Card key={template.id} className="flex flex-col md:flex-row justify-between items-start p-4">
                    <div className="flex-1 mb-4 md:mb-0">
                        <h3 className="font-bold text-lg">{template.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        <div className="flex gap-2 flex-wrap mt-2">
                            {template.competences.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => {setEditingTemplate(template); setIsFormOpen(true);}}>Modifier</Button>
                        <Dialog>
                            <DialogTrigger asChild><Button size="sm" variant="destructive" onClick={(e) => e.stopPropagation()}>Supprimer</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
                                <p>Voulez-vous vraiment supprimer le modèle "{template.title}" ?</p>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                                    <DialogClose asChild><Button variant="destructive" onClick={() => handleDeleteTemplate(template.id)}>Supprimer</Button></DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button size="sm" onClick={() => setLaunchingTemplate(template)}><Rocket className="mr-2"/>Lancer</Button>
                    </div>
                </Card>
            )) : <p className="text-muted-foreground text-center py-8">Aucun modèle de scénario. Créez-en un pour commencer !</p>}
          </div>
        </CardContent>
      </Card>
      
      {/* Launch Scenario Dialog */}
      <Dialog open={!!launchingTemplate} onOpenChange={() => setLaunchingTemplate(undefined)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Lancer le scénario : {launchingTemplate?.title}</DialogTitle>
                <CardDescription>Sélectionnez une classe pour démarrer le scénario. Cela assignera les rôles et les tâches aux élèves.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Label htmlFor="class-select">Classe</Label>
                 <Select onValueChange={setSelectedClass} value={selectedClass}>
                    <SelectTrigger id="class-select"><SelectValue placeholder="Choisir une classe..." /></SelectTrigger>
                    <SelectContent>
                        {Array.from(classes.values()).map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setLaunchingTemplate(undefined)}>Annuler</Button>
                <Button onClick={handleLaunchScenario} disabled={!selectedClass}><Play className="mr-2"/>Lancer maintenant</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    