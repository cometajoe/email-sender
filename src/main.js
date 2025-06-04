import { Client, Users } from 'node-appwrite';
import { Resend } from 'resend';

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const users = new Users(client);

  try {

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, email, reason, message } = req.body;
    const subject = `Nuevo Contacto: ${reason || 'General'} - De: ${name}`;
    log(`Received contact form submission: ${JSON.stringify(name)}`);

    // Construct the email body correctly
    const emailHtmlBody = `
      <h1>Nuevo Mensaje del Formulario de Contacto</h1>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Motivo:</strong> ${reason || 'No especificado'}</p>
      <hr>
      <p><strong>Mensaje:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>Este correo fue enviado desde el formulario de contacto de la web Pies Contentos.</em></p>
    `;

    const emailTextBody = `
      Nuevo Mensaje del Formulario de Contacto:
      Nombre: ${name}
      Email: ${email}
      Motivo: ${reason || 'No especificado'}
      Mensaje:
      ${message}

      Este correo fue enviado desde el formulario de contacto de la web Pies Contentos.
    `;

    const { data, error } = await resend.emails.send({
      from: 'Pies contentos <onboarding@resend.dev>', // e.g., "Pies Contentos Web <noreply@yourdomain.com>"
      to: [process.env.RECIPIENT_EMAIL], // Array of recipient emails
      subject: subject,
      html: emailHtmlBody,
      text: emailTextBody, // Optional: include a plain text version
      reply_to: email, // Set the user's email as the reply-to address
    });

    if (error) {
      log(`Error sending email via Resend: ${error.message}`);
      return res.json({ "success": "false", "message": `Error al enviar el mensaje: ${error.message || 'Error desconocido de Resend'}` });
    }

    log(`Email sent successfully: ${JSON.stringify(data)}`);
    return res.json({
      "message": "Mensaje enviado correctamente",
    });



  } catch (err) {
    error("Could not list users: " + err.message);
    return res.json({ "success": "false", "message": `Error al enviar el mensaje: ${err.message || 'Error desconocido'}` });
  }

};
