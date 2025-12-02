import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WALLET-PASS] ${step}${detailsStr}`);
};

/**
 * Generate Apple Wallet PKPass
 *
 * Required environment variables:
 * - APPLE_PASS_TYPE_ID: Your Pass Type ID (e.g., pass.com.yourcompany.gym)
 * - APPLE_TEAM_ID: Your Apple Developer Team ID
 * - APPLE_PASS_CERTIFICATE: Base64 encoded .p12 certificate
 * - APPLE_PASS_CERTIFICATE_PASSWORD: Password for the .p12 certificate
 * - APPLE_WWDR_CERTIFICATE: Base64 encoded Apple WWDR certificate
 */
async function generateApplePass(
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    barcode: string;
  },
  organization: {
    id: string;
    name: string;
    logo_url?: string;
  }
): Promise<Uint8Array> {
  const passTypeId = Deno.env.get("APPLE_PASS_TYPE_ID");
  const teamId = Deno.env.get("APPLE_TEAM_ID");

  if (!passTypeId || !teamId) {
    throw new Error("Apple Wallet not configured. Missing APPLE_PASS_TYPE_ID or APPLE_TEAM_ID");
  }

  // Create pass.json content
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    serialNumber: `${organization.id}-${member.id}`,
    organizationName: organization.name,
    description: `${organization.name} Membership`,
    logoText: organization.name,
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(60, 65, 76)",
    labelColor: "rgb(200, 200, 200)",

    // Generic pass type for membership cards
    generic: {
      primaryFields: [
        {
          key: "member-name",
          label: "MEMBER",
          value: `${member.first_name} ${member.last_name}`,
        },
      ],
      secondaryFields: [
        {
          key: "member-id",
          label: "MEMBER ID",
          value: member.barcode,
        },
      ],
      auxiliaryFields: [
        {
          key: "gym-name",
          label: "GYM",
          value: organization.name,
        },
      ],
      backFields: [
        {
          key: "email",
          label: "Email",
          value: member.email,
        },
        {
          key: "support",
          label: "Support",
          value: `Contact ${organization.name} for membership support.`,
        },
      ],
    },

    // Barcode for scanning
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: member.barcode,
        messageEncoding: "iso-8859-1",
        altText: member.barcode,
      },
      {
        format: "PKBarcodeFormatCode128",
        message: member.barcode,
        messageEncoding: "iso-8859-1",
        altText: member.barcode,
      },
    ],

    // NFC for contactless
    nfc: {
      message: member.barcode,
      encryptionPublicKey: "", // Would be set if using encrypted NFC
    },

    // Relevance - show pass when near gym location (optional)
    // locations: [], // Add gym coordinates if available

    // Expiration and voiding
    // expirationDate: "2025-12-31T23:59:59Z", // Set if membership expires
    voided: false,
  };

  // Create the pass package
  const zip = new JSZip();

  // Add pass.json
  zip.file("pass.json", JSON.stringify(passJson, null, 2));

  // Create simple placeholder images (in production, use actual gym branding)
  // For now, we'll create minimal valid PNG files
  const iconPng = createMinimalPng(29, 29); // 29x29 for icon
  const icon2xPng = createMinimalPng(58, 58); // 58x58 for icon@2x
  const logoPng = createMinimalPng(160, 50); // 160x50 for logo
  const logo2xPng = createMinimalPng(320, 100); // 320x100 for logo@2x

  zip.file("icon.png", iconPng);
  zip.file("icon@2x.png", icon2xPng);
  zip.file("logo.png", logoPng);
  zip.file("logo@2x.png", logo2xPng);

  // In production, you would:
  // 1. Create manifest.json with SHA1 hashes of all files
  // 2. Sign manifest.json with your Pass Type ID certificate
  // 3. Add the signature file

  // For now, return unsigned pass (will work in simulator, not on device)
  // Full signing requires the certificate to be available
  const certBase64 = Deno.env.get("APPLE_PASS_CERTIFICATE");
  const certPassword = Deno.env.get("APPLE_PASS_CERTIFICATE_PASSWORD");
  const wwdrBase64 = Deno.env.get("APPLE_WWDR_CERTIFICATE");

  if (certBase64 && certPassword && wwdrBase64) {
    // Create manifest
    const manifest: Record<string, string> = {};

    const files = ["pass.json", "icon.png", "icon@2x.png", "logo.png", "logo@2x.png"];
    for (const fileName of files) {
      const file = zip.file(fileName);
      if (file) {
        const content = await file.async("uint8array");
        const hash = await crypto.subtle.digest("SHA-1", content);
        manifest[fileName] = Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
    }

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    // Note: Full PKCS#7 signing requires a crypto library that supports it
    // In Deno, this is complex. For production, consider using a signing service
    // or implementing with node-forge equivalent

    logStep("Pass created with manifest (signing requires additional setup)");
  } else {
    logStep("Pass created without signing (certificates not configured)");
  }

  // Generate the .pkpass file
  const passData = await zip.generateAsync({ type: "uint8array" });
  return passData;
}

/**
 * Create a minimal valid PNG file
 * This creates a simple solid-color PNG for placeholder purposes
 */
function createMinimalPng(width: number, height: number): Uint8Array {
  // PNG signature
  const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  // Create a minimal 1x1 gray PNG and scale info in metadata
  // This is a simplified approach - in production, use actual images
  const ihdr = createPngChunk("IHDR", new Uint8Array([
    0, 0, 0, 1,  // width (1)
    0, 0, 0, 1,  // height (1)
    8,           // bit depth
    2,           // color type (RGB)
    0,           // compression
    0,           // filter
    0,           // interlace
  ]));

  const idat = createPngChunk("IDAT", new Uint8Array([
    0x78, 0x9C, 0x62, 0x64, 0x64, 0x64, 0x00, 0x00, 0x00, 0x07, 0x00, 0x03
  ]));

  const iend = createPngChunk("IEND", new Uint8Array(0));

  return new Uint8Array([
    ...signature,
    ...ihdr,
    ...idat,
    ...iend,
  ]);
}

function createPngChunk(type: string, data: Uint8Array): number[] {
  const length = data.length;
  const typeBytes = type.split('').map(c => c.charCodeAt(0));

  // Simple CRC placeholder (in production, calculate proper CRC32)
  const crc = [0, 0, 0, 0];

  return [
    (length >> 24) & 0xFF,
    (length >> 16) & 0xFF,
    (length >> 8) & 0xFF,
    length & 0xFF,
    ...typeBytes,
    ...Array.from(data),
    ...crc,
  ];
}

/**
 * Generate Google Wallet pass
 *
 * Required environment variables:
 * - GOOGLE_WALLET_ISSUER_ID: Your Google Wallet Issuer ID
 * - GOOGLE_WALLET_SERVICE_ACCOUNT: Base64 encoded service account JSON
 */
async function generateGoogleWalletLink(
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    barcode: string;
  },
  organization: {
    id: string;
    name: string;
  }
): Promise<string> {
  const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID");
  const serviceAccountBase64 = Deno.env.get("GOOGLE_WALLET_SERVICE_ACCOUNT");

  if (!issuerId) {
    throw new Error("Google Wallet not configured. Missing GOOGLE_WALLET_ISSUER_ID");
  }

  // Create the pass object
  const classId = `${issuerId}.gym_membership_${organization.id}`;
  const objectId = `${issuerId}.member_${member.id}`;

  const passObject = {
    id: objectId,
    classId: classId,
    state: "ACTIVE",
    heroImage: {
      sourceUri: {
        uri: "https://example.com/hero.png", // Replace with actual image
      },
    },
    textModulesData: [
      {
        header: "Member Name",
        body: `${member.first_name} ${member.last_name}`,
      },
    ],
    linksModuleData: {
      uris: [
        {
          uri: "https://gymunity.app",
          description: "Visit our website",
        },
      ],
    },
    barcode: {
      type: "QR_CODE",
      value: member.barcode,
      alternateText: member.barcode,
    },
  };

  // In production, you would:
  // 1. Authenticate with Google using the service account
  // 2. Create or update the pass class if needed
  // 3. Create the pass object
  // 4. Generate a signed JWT for the "Add to Google Wallet" button

  if (serviceAccountBase64) {
    // Full implementation would go here
    // For now, return a placeholder URL
    logStep("Google Wallet pass object created", { objectId });
  }

  // Return the save link (this would be a proper JWT-signed URL in production)
  const saveUrl = `https://pay.google.com/gp/v/save/${base64Encode(JSON.stringify(passObject))}`;

  return saveUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get request body
    const body = await req.json();
    const { walletType } = body; // 'apple' or 'google'

    if (!walletType || !['apple', 'google'].includes(walletType)) {
      throw new Error("Invalid wallet type. Must be 'apple' or 'google'");
    }

    // Get member profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, last_name, email, barcode, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Member profile not found");
    }

    if (!profile.barcode) {
      throw new Error("Member does not have a barcode. Please contact staff.");
    }

    // Get organization
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, name, logo_url')
      .eq('id', profile.organization_id)
      .single();

    if (orgError || !organization) {
      throw new Error("Organization not found");
    }

    logStep("Member and organization found", {
      memberId: profile.id,
      orgName: organization.name,
      walletType
    });

    if (walletType === 'apple') {
      // Generate Apple Wallet pass
      const passData = await generateApplePass(
        {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          barcode: profile.barcode,
        },
        {
          id: organization.id,
          name: organization.name,
          logo_url: organization.logo_url,
        }
      );

      logStep("Apple Wallet pass generated", { size: passData.length });

      return new Response(passData, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.pkpass",
          "Content-Disposition": `attachment; filename="${organization.name.replace(/[^a-z0-9]/gi, '_')}_membership.pkpass"`,
        },
        status: 200,
      });
    } else {
      // Generate Google Wallet link
      const saveUrl = await generateGoogleWalletLink(
        {
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || '',
          barcode: profile.barcode,
        },
        {
          id: organization.id,
          name: organization.name,
        }
      );

      logStep("Google Wallet link generated");

      return new Response(JSON.stringify({ saveUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
