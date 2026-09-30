import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../config/api";

const AppContext = createContext()

const ROOT_BREADCRUMB = [{id: null, name:"My Drive"}]
const getErrMsg = (err, fallback) =>
  err.response?.data?.error || fallback;

export const AppProvider = ({ children }) => {

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

      // Upload Global State
      const [isUploading, setIsUploading] = useState(false);
      const [uploadProgress, setUploadProgress] = useState(0);

      // Drive View State
      const [currentFolderId, setCurrentFolderId] =useState(null)
      const [breadcrumbs, setBreadcrumbs] = useState(ROOT_BREADCRUMB)
      const [folder, setFolders] = useState([])
      const [files, setFiles] = useState([]);
      const [isDriveLoading, setIsDriveLoading] = useState(false)


      // Filter && Sort State 
    const [searchQuery, setSearchQuery] = useState("")
      const [sortBy, setSortBy] = useState("name_asc")


  // Refresh User Profile & Storage Stats
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      return null;
    }
  }, []);

  // Check Auth Status on App load
  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  // Auth Action Helper
  const authAction = async (requestFn, successMsg, errorFallback) => {
    try {
      const { data } = await requestFn();

      setUser(data.user);

      if (successMsg) {
        toast.success(successMsg);
      }

      return true;
    } catch (error) {
      toast.error(getErrMsg(error, errorFallback));
      return false;
    }
  };

  const login = (email, password) => {
    return authAction(
      () => api.post("/api/auth/login", { email, password }),
      "Welcome back!",
      "Login failed"
    );
  };

  const register = (name, email, password) => {
    return authAction(
      () =>
        api.post("/api/auth/register", {
          name,
          email,
          password,
        }),
      "Account created successfully",
      "Registration failed"
    );
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
      setUser(null);
      toast.success("Logged Out");
    } catch (error) {
      toast.error("Logout error");
    }
  };

         const fetchDriveContant = useCallback(()=>{
          async (folderId = CurrentFolderId, search = searchQuery, sort = sortBy)=>{
            if(!user) return;
            setIsDriveLoading(true)
            try {
               const parentParm = folderId || "null";
               const [folderRes, filesRes, detailsRes] = await Promise.all([
                api.get("/api/folders", {params: { parent_id: parentParm }}),
                 api.get("/api/files", {params: {folder_id: parentParm, search, sort }}),
                 folderId ? api.get(`/api/folders/${folderId}`) : null,
               ])

               setFolders(folderRes.data.folders);
               setFiles(filesRes.data.files);
               setBreadcrumbs(detailsRes?.data?.breadcrumbs || ROOT_BREADCRUMB)
            } catch {
              toast.error("Error loading drive contents");
            } finally{
              setIsDriveLoading(false)
            }
          }
         },[user, currentFolderId, searchQuery, sortBy])

  const value = {
    user,
    setUser,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    refreshUser,
    currentFolderId,
    setCurrentFolderId,
    breadcrumbs,
    folder,
    setFolders,
    files,
    setFiles,
    isDriveLoading,
    fetchDriveContant,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);