/**
 * Central Application Configuration for Gowa Mara
 * Developed by Maim
 */

export const APP_CONFIG = {
  appName: "Gowa Mara",
  developerName: "Maim",
  developerTitle: "Cybersecurity Enthusiast | Web & App Developer | UI/UX Designer | Software Engineering",
  developerBio: "Cybersecurity Enthusiast, Web & App Developer, UI/UX Designer, and Software Engineering specialist passionate about building high-performance, secure, and intuitive digital experiences.",
  
  /**
   * ADMIN PICTURE URL
   * You can add or change the admin / developer profile picture URL here directly:
   */
  adminPicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  
  // Contact & Social channels for Developer Maim
  whatsappUrl: "https://wa.me/8801700000000",
  gmailUrl: "mailto:mdmaim.69@gmail.com",
  adminEmail: "mdmaim.69@gmail.com",

  // Upload limits & formats
  maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  
  // Platform settings defaults
  defaultSettings: {
    registrationEnabled: true,
    approvalRequired: true, // Only approved users can publish
    sharingEnabled: false,   // By default, public URL sharing is restricted unless authorized
    maintenanceMode: false,
    maxUploadSizeMb: 10,
    allowedFormats: ["image/jpeg", "image/png", "image/webp", "image/gif"]
  }
};
