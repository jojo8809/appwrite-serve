import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServeAttemptData } from "./ServeAttempt";
import { sendEmail, createUpdateNotificationEmail } from "@/utils/email";
import { appwrite } from "@/lib/appwrite";
import { isGeolocationCoordinates } from "@/utils/gps";
import { ACTIVE_BACKEND, BACKEND_PROVIDER } from "@/config/backendConfig";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { debugImageData } from "@/utils/imageUtils";

interface EditServeDialogProps {
  serve: ServeAttemptData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedServe: ServeAttemptData) => Promise<boolean>;
}

const statusOptions = [
  "completed",
  "failed"
];

const statusDisplayMap: Record<string, string> = {
  "completed": "Served",
  "failed": "Failed Attempt",
};

export default function EditServeDialog({ serve, open, onOpenChange, onSave }: EditServeDialogProps) {
  const [status, setStatus] = useState<"completed" | "failed">(serve.status as "completed" | "failed");
  const [caseNumber, setCaseNumber] = useState<string>(serve.caseNumber || "");
  const [notes, setNotes] = useState<string>(serve.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("Client");
  const [coordinates, setCoordinates] = useState<any>(serve.coordinates || {});
  const { toast } = useToast();

  useEffect(() => {
    setStatus(serve.status as "completed" | "failed");
    setCaseNumber(serve.caseNumber || "");
    setNotes(serve.notes || "");
    setCoordinates(serve.coordinates || {});
  }, [serve]);

  useEffect(() => {
    const fetchClientEmail = async () => {
      console.log("Fetching client email for client ID:", serve.clientId);
      if (serve.clientId) {
        try {
          if (ACTIVE_BACKEND === BACKEND_PROVIDER.APPWRITE) {
            const clients = await appwrite.getClients();
            const client = clients.find(c => c.$id === serve.clientId || c.id === serve.clientId);

            if (client) {
              setClientEmail(client.email);
              setClientName(client.name || "Client");
              console.log("Fetched client email:", client.email);
            } else {
              console.warn("Client not found in getClients() response");
            }
          } else {
            const { data, error } = await supabase
              .from('clients')
              .select('email, name')
              .eq('id', serve.clientId)
              .single();

            if (!error && data) {
              setClientEmail(data.email);
              setClientName(data.name || "Client");
              console.log("Fetched client email from Supabase:", data.email);
            }
          }
        } catch (error) {
          console.error("Error fetching client email:", error);
        }
      }
    };

    if (open) {
      fetchClientEmail();
    }
  }, [open, serve.clientId]);

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      console.log("Saving serve update:", {
        id: serve.id,
        status,
        caseNumber,
        notes
      });

      const updatedServe: ServeAttemptData = {
        ...serve,
        status,
        caseNumber,
        notes,
      };

      const success = await onSave(updatedServe);
      console.log("Save result:", success);

      if (success) {
        console.log("Sending email notification for updated serve...");
        
        // Debug the image data if available
        if (serve.imageData) {
          console.log("Serve has image data, including in email:");
          debugImageData(serve.imageData);
        } else {
          console.log("Serve doesn't have image data for email");
        }
        
        // Create email body
        const emailBody = createUpdateNotificationEmail(
          clientName,
          caseNumber,
          new Date(serve.timestamp),
          serve.status,
          status,
          notes
        );

        // Set up recipients - always include business email
        const businessEmail = "info@justlegalsolutions.org";
        const recipients = [businessEmail];
        
        // Add client email if available
        if (clientEmail && clientEmail !== businessEmail) {
          recipients.push(clientEmail);
        }

        console.log(`Sending email to ${recipients.length} recipients, has image: ${!!serve.imageData}`);

        // Send email with image if available
        try {
          const emailResult = await sendEmail({
            to: recipients,
            subject: `Serve Attempt Updated - ${caseNumber}`,
            body: emailBody,
            html: emailBody,
            imageData: serve.imageData, // Will be uploaded to storage
            imageFormat: 'jpeg'
          });

          console.log("Email sending result:", emailResult);
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }

        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving serve attempt:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Serve Attempt</DialogTitle>
          <DialogDescription>
            Update the details of this serve attempt.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
          <div className="space-y-4 py-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value: "completed" | "failed") => setStatus(value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {statusDisplayMap[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseNumber">Case Number</Label>
              <Input
                id="caseNumber"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="Enter case number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this serve attempt"
                rows={4}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
