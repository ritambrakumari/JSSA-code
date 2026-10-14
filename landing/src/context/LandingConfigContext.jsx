import React, { createContext, useState, useEffect, useContext } from 'react';

const LandingConfigContext = createContext();

export const LandingConfigProvider = ({ children }) => {
  const [landingConfig, setLandingConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';
        const res = await fetch(`${apiUrl}/landing-config`);
        const data = await res.json();
        setLandingConfig(data);
      } catch (err) {
        console.error("Failed to fetch landing config", err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  return (
    <LandingConfigContext.Provider value={{ landingConfig, loadingConfig }}>
      {children}
    </LandingConfigContext.Provider>
  );
};

export const useLandingConfig = () => useContext(LandingConfigContext);
