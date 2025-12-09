
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
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Send, Inbox, Mail, ArrowLeft } from "lucide-react";
import type { Email } from "@/lib/types";

type EmailFormData = {
  recipient: string;
  subject: string;
  body: string;
};

// --- Formulaire de Composition ---
function ComposeEmail() {
  const { state, dispatch } = useWms();
  const { toast } = useToast();
  const { currentUser, users } = state;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EmailFormData>({
    defaultValues: { recipient: "", subject: "", body: "" },
  });

  const recipients = useMemo(() => {
    return Array.from(users.values())
      .filter(u => u.username !== currentUser?.username)
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [users, currentUser]);

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
    
    const recipientUser = users.get(data.recipient);
    toast({
        title: "E-mail envoyé",
        description: `Votre message à ${recipientUser?.username} a été envoyé.`
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
                        <SelectTrigger id="recipient"><SelectValue placeholder="Sélectionner un utilisateur..." /></SelectTrigger>
                        <SelectContent>
                          {recipients.map(r => (
                            <SelectItem key={r.username} value={r.username}>
                                {r.username} ({state.roles.get(r.roleId)?.name || r.profile})
                            </SelectItem>
                          ))}
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

// --- Affichage des e-mails ---
function Mailbox({ boxType }: { boxType: 'inbox' | 'sent' }) {
    const { state, dispatch } = useWms();
    const { currentUser, emails, users } = state;
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

    if (!currentUser) return <p>Veuillez vous connecter.</p>;
    
    const userEmails = Array.from(emails.values())
        .filter(e => boxType === 'inbox' ? e.recipient === currentUser.username : e.sender === currentUser.username)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email);
        if (boxType === 'inbox' && !email.isRead) {
            dispatch({ type: 'MARK_EMAIL_AS_READ', payload: { emailId: email.id } });
        }
    }
    
    const getParticipantName = (participantId: string): string => {
        return users.get(participantId)?.username || participantId;
    };

    // --- Vue détaillée d'un e-mail ---
    if (selectedEmail) {
        return (
            <div>
                <Button variant="ghost" onClick={() => setSelectedEmail(null)} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedEmail.subject}</CardTitle>
                        <CardDescription className="flex justify-between">
                            <span>
                                {boxType === 'inbox' ? `De : ${getParticipantName(selectedEmail.sender)}` : `À : ${getParticipantName(selectedEmail.recipient)}`}
                            </span>
                            <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{selectedEmail.body}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- Liste des e-mails ---
    return (
        <Card>
          <CardContent className="p-0">
            <Table>
                <TableBody>
                {userEmails.length > 0 ? (
                    userEmails.map(email => (
                    <TableRow key={email.id} onClick={() => handleEmailClick(email)} className={`cursor-pointer ${!email.isRead && boxType === 'inbox' ? 'font-bold bg-muted/50' : ''}`}>
                        <TableCell className="w-1/4">{getParticipantName(boxType === 'inbox' ? email.sender : email.recipient)}</TableCell>
                        <TableCell>{email.subject}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">{new Date(email.timestamp).toLocaleDateString()}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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

// --- Composant Principal ---
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
            <Inbox className="mr-2" /> Boîte de réception {unreadCount > 0 && <span className="ml-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">{unreadCount}</span>}
        </TabsTrigger>
        <TabsTrigger value="sent"><Send className="mr-2" /> Messages envoyés</TabsTrigger>
        <TabsTrigger value="compose"><Mail className="mr-2" /> Nouveau Message</TabsTrigger>
      </TabsList>
      <TabsContent value="inbox"><Mailbox boxType="inbox"/></TabsContent>
      <TabsContent value="sent"><Mailbox boxType="sent"/></TabsContent>
      <TabsContent value="compose">
        <Card>
            <CardHeader>
                <CardTitle>Écrire un nouveau message</CardTitle>
                <CardDescription>Envoyez un message à un autre utilisateur du système.</CardDescription>
            </CardHeader>
            <CardContent><ComposeEmail /></CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
