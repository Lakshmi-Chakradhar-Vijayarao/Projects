
'use server';

import { Resend } from 'resend';
import { z } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500, { message: "Message must be less than 500 characters." }),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

interface SendEmailResponse {
  success: boolean;
  message: string;
  error?: string | Record<string, string[] | undefined>; // Can be a general error string or Zod field errors
}

const resendApiKey = process.env.RESEND_API_KEY;
const senderEmail = process.env.EMAIL_SENDER_ADDRESS;
const receiverEmail = process.env.EMAIL_RECEIVER_ADDRESS;

export async function sendContactEmail(data: ContactFormInput): Promise<SendEmailResponse> {
  if (!resendApiKey) {
    console.error('Resend API key is not configured.');
    return { success: false, message: 'Email server configuration error. Please contact support.' };
  }
  if (!senderEmail) {
    console.error('Sender email address is not configured in environment variables.');
    return { success: false, message: 'Sender email address is not configured on the server.' };
  }
  if (!receiverEmail) {
    console.error('Receiver email address is not configured in environment variables.');
    return { success: false, message: 'Recipient email address is not configured on the server.' };
  }

  const validation = contactFormSchema.safeParse(data);

  if (!validation.success) {
    return { 
      success: false, 
      message: 'Invalid form data. Please check the fields.', 
      error: validation.error.flatten().fieldErrors 
    };
  }

  const { name, email, message } = validation.data;
  const resend = new Resend(resendApiKey);

  try {
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `Portfolio Contact <${senderEmail}>`, // IMPORTANT: This email must be verified in your Resend account.
      to: [receiverEmail], // Your email address to receive messages
      subject: `New Contact Message from ${name} - Portfolio`,
      reply_to: email,
      html: `
        <div>
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend API Error:', emailError);
      return { success: false, message: 'Failed to send email due to a server issue.', error: emailError.message };
    }

    console.log('Email sent successfully via Resend:', emailData);
    return { success: true, message: 'Message sent successfully!' };
  } catch (e) {
    const err = e as Error;
    console.error('Error sending email:', err);
    return { success: false, message: 'An unexpected error occurred while trying to send the email.', error: err.message };
  }
}
