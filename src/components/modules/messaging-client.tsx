
"use client";

import { useWms } from "@/context/WmsContext";
import { useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Send, Inbox, Mail } from "lucide-react";
import type { Email, Tier, User } from "@/lib/types";

type EmailFormData = {
  recipient: string;
  subject: string;
  body: string;
};

function ComposeEmail() {
  const { state, dispatch } = useWms();
  const { toast } = useToast();
  const { currentUser, users, tiers, currentUserPermissions } = state;

  const { userRecipients, tierRecipients } = useMemo(() => {
    if (!currentUser || !currentUserPermissions) return { userRecipients: [], tierRecipients: [] };

    let allUsers = Array.from(users.values());
    let visibleUsers: User[] = [];

    if (currentUserPermissions.isSuperAdmin) {
        visibleUsers = allUsers;
    } else if (currentUser.profile === 'professeur') {
        const managedClassIds = Array.from(state.classes.values())
            .filter(c => c.teacherIds?.includes(currentUser.username))
            .map(c => c.id);
        
        visibleUsers = allUsers.filter(u => 
            u.profile === 'professeur' || 
            u.profile === 'Administrateur' || 
            (u.profile === 'élève' && u.classId && managedClassIds.includes(u.classId))
        );
    } else if (currentUser.profile === 'élève') {
        const studentClass = state.classes.get(currentUser.classId || -1);
        const teacherUsernames = studentClass?.teacherIds || [];
        visibleUsers = allUsers.filter(u => 
            (u.profile === 'élève' && u.classId === currentUser.classId) || 
            teacherUsernames.includes(u.username)
        );
    }
    
    // Filter self and sort
    const finalUserRecipients = visibleUsers
      .filter(u => u.username !== currentUser.username)
      .sort((a,b) => a.username.localeCompare(b.username));

    const finalTierRecipients = Array.from(tiers.values())
      .filter(t => t.type !== 'Vehicule')
      .sort((a, b) => a.name.localeCompare(b.name));

    return { userRecipients: finalUserRecipients, tierRecipients: finalTierRecipients };

  }, [currentUser, currentUserPermissions, users, state.classes, tiers]);


  const { control, handleSubmit, reset, formState: { errors } } = useForm<EmailFormData>({
    defaultValues: { recipient: "", subject: "", body: "" },
  });

  const onSubmit = (data: EmailFormData) => {
    if (!currentUser) return;
    
    dispatch({
        type: "SEND_EMAIL",
        payload: {
            sender: currentUser.username,
            recipient: data.recipient,
            subject: data.subject,
            body: data.body,
        }
    });
    
    const recipientName = getParticipantName({users, tiers}, data.recipient)

    toast({
        title: "E-mail envoyé",
        description: `Votre message à ${recipientName} a été envoyé.`
    });
    reset();
  }

  return (
     <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
            <Label htmlFor="recipient">Destinataire</Label>
             <Controller
                name="recipient"
                control={control}
                rules={{ required: "Le destinataire est requis" }}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="recipient"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {userRecipients.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Utilisateurs</SelectLabel>
                              {userRecipients.map(r => <SelectItem key={r.username} value={r.username}>{r.username} ({state.roles.get(r.roleId)?.name || r.profile})</SelectItem>)}
                            </SelectGroup>
                          )}
                           {tierRecipients.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Tiers (Clients, Fournisseurs, Transporteurs)</SelectLabel>
                              {tierRecipients.map(t => <SelectItem key={t.id} value={`tier-${t.id}`}>{t.name} ({t.type})</SelectItem>)}
                            </SelectGroup>
                          )}
                        </SelectContent>
                    </Select>
                )}
                />
            {errors.recipient && <p className="text-sm text-destructive mt-1">{errors.recipient.message}</p>}
        </div>
        <div>
            <Label htmlFor="subject">Sujet</Label>
            <Controller name="subject" control={control} rules={{required: "Le sujet est requis"}} render={({field}) => <Input id="subject" {...field} />} />
             {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>}
        </div>
        <div>
            <Label htmlFor="body">Message</Label>
            <Controller name="body" control={control} rules={{required: "Le message ne peut pas être vide"}} render={({field}) => <Textarea id="body" rows={8} {...field} />} />
            {errors.body && <p className="text-sm text-destructive mt-1">{errors.body.message}</p>}
        </div>
        <Button type="submit"><Send className="mr-2"/>Envoyer</Button>
     </form>
  )
}

const getParticipantName = (state: { users: Map<string, User>, tiers: Map<number, Tier> }, participantId: string): string => {
  if (participantId.startsWith('tier-')) {
    const tierId = parseInt(participantId.replace('tier-', ''), 10);
    return state.tiers.get(tierId)?.name || 'Tiers Inconnu';
  }
  return state.users.get(participantId)?.username || participantId;
};

function Mailbox({ boxType }: { boxType: 'inbox' | 'sent' }) {
    const { state, dispatch } = useWms();
    const { currentUser, emails, tiers, users } = state;
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

    if (!currentUser) return <p>Veuillez vous connecter.</p>
    
    const userEmails = Array.from(emails.values())
        .filter(e => boxType === 'inbox' ? e.recipient === currentUser.username : e.sender === currentUser.username)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email);
        if (boxType === 'inbox' && !email.isRead) {
            dispatch({ type: 'MARK_EMAIL_AS_READ', payload: { emailId: email.id } });
        }
    }

    if (selectedEmail) {
        return (
            <div>
                <Button variant="outline" onClick={() => setSelectedEmail(null)} className="mb-4">Retour</Button>
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedEmail.subject.replace(/\[Copie de .*?\] |\[Pour correction -.*?\] /g, '')}</CardTitle>
                        <CardDescription>
                            {boxType === 'inbox' ? `De : ${getParticipantName({users, tiers}, selectedEmail.sender)}` : `À : ${getParticipantName({users, tiers}, selectedEmail.recipient)}`}
                            <span className="float-right">{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{selectedEmail.body}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Card>
          <CardContent className="p-0">
            <Table>
                <TableBody>
                {userEmails.length > 0 ? (
                    userEmails.map(email => (
                    <TableRow key={email.id} onClick={() => handleEmailClick(email)} className={`cursor-pointer ${!email.isRead && boxType === 'inbox' ? 'font-bold' : ''}`}>
                        <TableCell className="w-1/4">{getParticipantName({users, tiers}, boxType === 'inbox' ? email.sender : email.recipient)}</TableCell>
                        <TableCell>{email.subject.replace(/\[Copie de .*?\] |\[Pour correction -.*?\] /g, '')}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">{new Date(email.timestamp).toLocaleDateString()}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        {boxType === 'inbox' ? "Votre boîte de réception est vide." : "Vous n'avez envoyé aucun message."}
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    )
}

export function MessagingClient() {
  const { state } = useWms();
  const { currentUser, currentUserPermissions, emails } = state;
  
  if (!currentUserPermissions?.canUseMessaging) {
      return (
        <Card>
            <CardHeader><CardTitle>Messagerie</CardTitle></CardHeader>
            <CardContent><p>Vous n'avez pas les permissions nécessaires pour voir cette page.</p></CardContent>
        </Card>
      )
  }
  
  const unreadCount = Array.from(emails.values()).filter(e => e.recipient === currentUser?.username && !e.isRead).length;

  return (
    <Tabs defaultValue="inbox" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="inbox">
            <Inbox className="mr-2" /> Boîte de réception {unreadCount > 0 && <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 text-xs">{unreadCount}</span>}
        </TabsTrigger>
        <TabsTrigger value="sent"><Send className="mr-2" /> Messages envoyés</TabsTrigger>
        <TabsTrigger value="compose"><Mail className="mr-2" /> Nouveau Message</TabsTrigger>
      </TabsList>
      <TabsContent value="inbox"><Mailbox boxType="inbox"/></TabsContent>
      <TabsContent value="sent"><Mailbox boxType="sent"/></TabsContent>
      <TabsContent value="compose">
        <Card>
            <CardHeader><CardTitle>Écrire un nouveau message</CardTitle></CardHeader>
            <CardContent><ComposeEmail /></CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
