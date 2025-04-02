import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Configure as an edge function
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { caseDetails, clientEmail } = await request.json();

    const adminEmail = 'info@justlegalsolutions.org';

    // Send email to client
    await resend.emails.send({
      from: 'notifications@justlegalsolutions.tech',
      to: clientEmail,
      subject: `Your case has been updated: ${caseDetails.id}`,
      html: `
        <h1>Case Update</h1>
        <p>Hello,</p>
        <p>Your case ${caseDetails.id} has been updated.</p>
        <p>Current status: ${caseDetails.status}</p>
        <p>Last updated: ${new Date().toLocaleString()}</p>
        <p>Please login to check the details.</p>
      `,
    });

    // Send email to admin
    await resend.emails.send({
      from: 'notifications@justlegalsolutions.tech',
      to: adminEmail,
      subject: `Case updated: ${caseDetails.id}`,
      html: `
        <h1>Case Update Notification</h1>
        <p>Case ${caseDetails.id} has been updated.</p>
        <p>Client: ${caseDetails.clientName}</p>
        <p>Status: ${caseDetails.status}</p>
        <p>Updated at: ${new Date().toLocaleString()}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
