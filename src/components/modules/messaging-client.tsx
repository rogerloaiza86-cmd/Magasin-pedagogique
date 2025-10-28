"use client";

import { useWms } from "@/context/WmsContext";
import { useState } from "react";
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
import { Send, Trash2, Archive, Inbox, Mail } from "lucide-react";
import type { Email } from "@/lib/types";

type EmailFormData = {
  recipient: string;
  subject: string;
  body: string;
};

function ComposeEmail() {
  const { state, dispatch } = useWms();
  const { toast } = useToast();
  const { currentUser, users, classes } = state;

  const getPossibleRecipients = () => {
    if (!currentUser) return [];
    
    if (currentUser.profile === 'élève') {
        const userClassId = currentUser.classId;
        if (!userClassId) return [];
        const studentClass = classes.get(userClassId);
        const recipients = Array.from(users.values()).filter(u => 
            (u.profile === 'élève' && u.classId === userClassId && u.username !== currentUser.username)
        );
        if (studentClass && studentClass.teacherIds) {
           studentClass.teacherIds.forEach(teacherId => {
                const teacher = users.get(teacherId);
                if (teacher) recipients.push(teacher);
           });
        }
        return recipients;
    }
    
    if (currentUser.profile === 'professeur') {
        const teacherClasses = Array.from(classes.values()).filter(c => c.teacherIds?.includes(currentUser.username));
        const studentUsernames = new Set<string>();
        teacherClasses.forEach(c => {
             Array.from(users.values()).forEach(u => {
                if (u.profile === 'élève' && u.classId === c.id) {
                    studentUsernames.add(u.username);
                }
             })
        });
        return Array.from(studentUsernames).map(username => users.get(username)).filter(Boolean) as any[];
    }

    // Admin can message anyone
    if (currentUser.profile === 'Administrateur') {
        return Array.from(users.values()).filter(u => u.username !== currentUser.username);
    }

    return [];
  };

  const recipients = getPossibleRecipients();

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

    toast({
        title: "E-mail envoyé",
        description: `Votre message à ${data.recipient} a été envoyé.`
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
                            {recipients.map(r => <SelectItem key={r.username} value={r.username}>{r.username} ({r.profile})</SelectItem>)}
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

function Mailbox({ boxType }: { boxType: 'inbox' | 'sent' }) {
    const { state, dispatch } = useWms();
    const { currentUser, emails } = state;
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
                        <CardTitle>{selectedEmail.subject}</CardTitle>
                        <CardDescription>
                            {boxType === 'inbox' ? `De : ${selectedEmail.sender}` : `À : ${selectedEmail.recipient}`}
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
                        <TableCell className="w-1/4">{boxType === 'inbox' ? email.sender : email.recipient}</TableCell>
                        <TableCell>{email.subject}</TableCell>
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
  const unreadCount = Array.from(state.emails.values()).filter(e => e.recipient === state.currentUser?.username && !e.isRead).length;

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
