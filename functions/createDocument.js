import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    // Initialize Appwrite Client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT) // Appwrite API Endpoint
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)    // Appwrite Project ID
      .setKey(req.headers['x-appwrite-key']);                  // Dynamic API Key

    const databases = new Databases(client);

    // Parse request body
    const body = req.bodyJson;
    if (!body || !body.collectionId || !body.data) {
      error('Invalid request body');
      return res.json({ success: false, message: 'Invalid request body' }, 400);
    }

    // Create a document
    const document = await databases.createDocument(
      process.env.APPWRITE_FUNCTION_DATABASE_ID, // Database ID
      body.collectionId,                         // Collection ID
      ID.unique(),                               // Unique Document ID
      body.data                                  // Document Data
    );

    log('Document created successfully:', document);
    return res.json({ success: true, document });
  } catch (err) {
    error('Error creating document:', err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};
