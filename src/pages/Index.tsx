import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/utils/email";
import { testEmailFunctionality } from "@/utils/testEmail";
import { Loader2, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { isAppwriteConfigured } from "@/config/backendConfig";
import { appwrite } from "@/lib/appwrite";

const Index = () => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("Test Email from ServeTracker");
  const [emailBody, setEmailBody] = useState(
    "This is a test email from your ServeTracker application.\n\nIf you received this email, your email sending functionality is working correctly!\n\nTime sent: " + 
    new Date().toLocaleString()
  );
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const configured = isAppwriteConfigured();
    setIsSupabaseReady(configured);
    
    if (!configured) {
      setError("Appwrite configuration is missing. Email functionality may not work.");
    }
    
    console.log("Environment check:");
    console.log("- Appwrite configured:", configured);
    console.log("- URL:", window.location.href);
    console.log("- User agent:", navigator.userAgent);
  }, []);

  const handleSendTestEmail = async () => {
    if (isSending) return;
    
    setIsSending(true);
    setSent(false);
    setError(null);

    try {
      console.log("Starting email send attempt...");
      console.log("Email details:", {
        to: recipientEmail,
        subject: subject,
        bodyLength: emailBody.length
      });
      
      const result = await testEmailFunctionality();
      
      console.log("Email send result:", result);
      
      if (result.success) {
        setSent(true);
        toast({
          title: "Email sent successfully",
          description: `Email was sent to ${recipientEmail} and info@justlegalsolutions.org`,
          variant: "default"
        });
      } else {
        setError(result.message);
        toast({
          title: "Failed to send email",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error in email sending:", err);
      setError(errorMessage);
      toast({
        title: "Email sending error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const updateEmailTime = () => {
    setEmailBody(prev => {
      const baseText = "This is a test email from your ServeTracker application.\n\nIf you received this email, your email sending functionality is working correctly!\n\nTime sent: ";
      return baseText + new Date().toLocaleString();
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">ServeTracker Email Test</CardTitle>
          <CardDescription>
            Test email functionality for your process serving notifications
          </CardDescription>
        </CardHeader>
        
        {!isSupabaseReady && (
          <div className="mx-6 mb-4 bg-amber-50 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <p className="text-amber-700 text-sm">
              Appwrite configuration may be incomplete. Email functionality might not work properly.
            </p>
          </div>
        )}
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Recipient Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={isSending}
            />
            <p className="text-xs text-gray-500 mt-1">
              The business email (info@justlegalsolutions.org) will automatically be added as a recipient.
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject
            </label>
            <Input
              id="subject"
              type="text"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium">
              Email Content
            </label>
            <Textarea
              id="body"
              placeholder="Email body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              disabled={isSending}
              rows={5}
              className="resize-none"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={updateEmailTime}
              className="text-xs mt-1"
              disabled={isSending}
            >
              Update timestamp
            </Button>
          </div>

          {sent && (
            <div className="bg-green-50 p-3 rounded-md flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700 text-sm">Email sent successfully!</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-3 rounded-md flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">Error sending email</p>
                <p className="text-red-600 text-xs mt-1 break-words">{error}</p>
              </div>
            </div>
          )}
        </CardContent>

        <div className="mx-6 mb-4">
          <details className="text-sm">
            <summary className="cursor-pointer text-primary font-medium">
              Email Troubleshooting Tools
            </summary>
            <div className="mt-2 border rounded p-3 space-y-2">
              <p className="text-xs text-gray-600">
                If emails aren't being sent, you can use these tools to diagnose issues.
              </p>
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setIsSending(true);
                    try {
                      const result = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA`
                        },
                        body: JSON.stringify({
                          from: "ServeTracker <no-reply@justlegalsolutions.tech>",
                          to: ["info@justlegalsolutions.org"],
                          subject: "Direct API Test",
                          html: "<p>This is a direct API test</p>"
                        })
                      });
                      const data = await result.json();
                      toast({
                        title: data.id ? "Direct API Test Passed" : "Direct API Test Failed",
                        description: data.id ? `Email sent with ID: ${data.id}` : (data.message || "Unknown error"),
                        variant: data.id ? "default" : "destructive"
                      });
                    } catch (err) {
                      toast({
                        title: "Direct API Test Failed",
                        description: err.message || "Unknown error",
                        variant: "destructive"
                      });
                    } finally {
                      setIsSending(false);
                    }
                  }}
                >
                  Test Direct API
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setIsSending(true);
                    try {
                      const response = await appwrite.functions.createExecution(
                        "67ec44660011c13116cd",
                        JSON.stringify({
                          to: ["info@justlegalsolutions.org"],
                          subject: "Function Test",
                          body: "<p>This is a function test</p>",
                          apiKey: "re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA"
                        })
                      );
                      
                      toast({
                        title: response.status === "completed" ? "Function Test Completed" : "Function Test Failed",
                        description: response.status === "completed" ? "Email function executed successfully" : 
                          `Function failed with status: ${response.status}`,
                        variant: response.status === "completed" ? "default" : "destructive"
                      });
                    } catch (err) {
                      toast({
                        title: "Function Test Failed",
                        description: err.message || "Unknown error",
                        variant: "destructive"
                      });
                    } finally {
                      setIsSending(false);
                    }
                  }}
                >
                  Test Function Method
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    if (!window.fixClientIdsInServeAttempts) {
                      toast({
                        title: "Fix Tool Not Available",
                        description: "The fix client IDs tool is not available",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    setIsSending(true);
                    try {
                      const result = await window.fixClientIdsInServeAttempts();
                      toast({
                        title: "Client ID Fix Complete",
                        description: result.message,
                        variant: "default"
                      });
                    } catch (err) {
                      toast({
                        title: "Fix Failed",
                        description: err.message || "Unknown error",
                        variant: "destructive"
                      });
                    } finally {
                      setIsSending(false);
                    }
                  }}
                >
                  Fix Client IDs in Serves
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                If issues persist, contact support with the console logs.
              </p>
            </div>
          </details>
        </div>

        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSendTestEmail}
            disabled={isSending || !recipientEmail}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" /> 
                Send Test Email
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Index;
