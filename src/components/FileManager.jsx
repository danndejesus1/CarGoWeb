import React, { useState, useEffect } from 'react';
import { account } from '../appwrite/config';
import { getAllFiles, getFilePreview } from '../appwrite/fileManager';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [userFiles, setUserFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
    loadAllFiles();
  }, []);

  const getCurrentUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
      filterUserFiles(userData);
    } catch (error) {
      console.error('Failed to get user:', error);
    }
  };

  const loadAllFiles = async () => {
    setLoading(true);
    try {
      const result = await getAllFiles();
      if (result.success) {
        setFiles(result.files);
        console.log('All files in bucket:', result.files);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUserFiles = async (userData) => {
    if (!userData || !userData.prefs) return;
    
    // Get user's ID file information from preferences
    const { idFileId, idFileName, fileCategory } = userData.prefs;
    
    if (idFileId) {
      setUserFiles([{
        fileId: idFileId,
        fileName: idFileName || 'Unknown',
        category: fileCategory || 'user_id',
        type: 'ID Document'
      }]);
    }
  };

  const FileCard = ({ file, isUserFile = false }) => (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="mb-2">
        {isUserFile ? (
          <div>
            <h4 className="font-semibold text-sm text-green-600">{file.type}</h4>
            <p className="text-xs text-gray-500">Organized Name: {file.fileName}</p>
            <p className="text-xs text-gray-500">File ID: {file.fileId}</p>
            <p className="text-xs text-gray-500">Category: {file.category}</p>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold text-sm">Storage File</h4>
            <p className="text-xs text-gray-500">File ID: {file.$id}</p>
            <p className="text-xs text-gray-500">Original: {file.name}</p>
            <p className="text-xs text-gray-500">Size: {(file.sizeOriginal / 1024).toFixed(1)} KB</p>
          </div>
        )}
      </div>
      
      {/* Preview if it's an image */}
      {isUserFile && (
        <div className="mt-2">
          <img 
            src={getFilePreview(file.fileId, 200, 150)} 
            alt="Preview"
            className="w-full h-24 object-cover rounded border"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">File Organization Demo</h2>
      
      {/* Explanation */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">How File Organization Works:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Storage</strong>: Files are stored with random IDs (like: 67890abc-def1-2345-6789-abcdef123456)</li>
          <li>• <strong>Organization</strong>: We track organized names in user preferences or database</li>
          <li>• <strong>Filtering</strong>: We use metadata to identify file types (ID, vehicle images, etc.)</li>
          <li>• <strong>Original filename</strong>: Still preserved but not used for storage</li>
        </ul>
      </div>

      {loading && <div className="text-center">Loading files...</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User's Organized Files */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-600">Your Organized Files</h3>
          <div className="space-y-4">
            {userFiles.length > 0 ? (
              userFiles.map((file, index) => (
                <FileCard key={index} file={file} isUserFile={true} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No organized files found for this user.</p>
            )}
          </div>
        </div>

        {/* All Storage Files (Raw) */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-600">Raw Storage Files</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {files.length > 0 ? (
              files.map((file) => (
                <FileCard key={file.$id} file={file} isUserFile={false} />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No files in storage bucket.</p>
            )}
          </div>
        </div>
      </div>

      {/* File Organization Summary */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Summary:</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Files:</span> {files.length}
          </div>
          <div>
            <span className="font-medium">Your Files:</span> {userFiles.length}
          </div>
          <div>
            <span className="font-medium">User ID:</span> {user?.$id || 'Not logged in'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;