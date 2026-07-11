import { logger } from '@/utils/logger';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export type Feature = 'crm' | 'whatsapp' | 'ia_triage' | 'reports' | 'team' | 'api';

interface PlanLimits {
  users: number;
  properties: number;
  whatsapp_instances: number;
}

interface Plan {
  id: string;
  name: string;
  features: Feature[];
  limits: PlanLimits;
}

interface PlansContextType {
  currentPlan: Plan | null;
  loading: boolean;
  hasFeature: (feature: Feature) => boolean;
  checkLimit: (limit: keyof PlanLimits, currentValue: number) => boolean;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export const PlansProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchPlan();
    else setLoading(false);
  }, [user]);

  const fetchPlan = async () => {
    if (!user) return;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.organization_id) {
        setLoading(false);
        return;
      }

      const { data: orgData, error } = await supabase
        .from('organizations')
        .select(
          `
            plan_id,
            plans (
              id,
              name,
              features,
              limits
            )
          `
        )
        .eq('id', profileData.organization_id)
        .single();

      if (error) throw error;

      if (orgData?.plans) {
        setCurrentPlan(orgData.plans as unknown as Plan);
      }
    } catch (error) {
      logger.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: Feature): boolean => {
    if (profile?.role === 'superadmin') return true;
    if (!currentPlan || !Array.isArray(currentPlan.features)) return false;
    return currentPlan.features.includes(feature);
  };

  const checkLimit = (limit: keyof PlanLimits, currentValue: number): boolean => {
    if (profile?.role === 'superadmin') return true;
    if (!currentPlan?.limits) return false;
    return currentValue < currentPlan.limits[limit];
  };

  return (
    <PlansContext.Provider value={{ currentPlan, loading, hasFeature, checkLimit }}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => {
  const context = useContext(PlansContext);
  if (context === undefined) {
    throw new Error('usePlans must be used within a PlansProvider');
  }
  return context;
};
