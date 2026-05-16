import nodemailer from "nodemailer";

// Using Ethereal Email for testing purposes
// It generates a mock inbox and prints a URL to view the emails
export async function sendAssignmentEmail(userEmail, userName, projectName, action) {
  try {
    // Generate test SMTP service account from ethereal.email
    let testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const subject = action === "add" 
      ? `You have been assigned to project: ${projectName}`
      : `You have been removed from project: ${projectName}`;
      
    const text = action === "add"
      ? `Hello ${userName},\n\nYou have been added as a tasker to the project "${projectName}". Log in to the dashboard to view your new assignment.`
      : `Hello ${userName},\n\nYou have been removed from the project "${projectName}".`;

    let info = await transporter.sendMail({
      from: '"Team Task Manager" <admin@taskmanager.local>',
      to: userEmail,
      subject: subject,
      text: text,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
