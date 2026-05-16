import React, { useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { saveUserProfile } from '@/src/services/firestoreService';
import { getCurrentSemesterType, getCurrentAcademicYearForPhase } from '@/src/lib/dateUtils';

export const ProfileAutoSync = () => {
  const { userId, profile, refreshProfile } = useAuth();

  useEffect(() => {
    if (userId && profile) {
      const currentYear = getCurrentAcademicYearForPhase();
      const currentPhase = getCurrentSemesterType();
      const currentFullPhase = `Semester ${currentYear} ${currentPhase}`;
      
      const needsUpdate = 
        profile.nim !== '051225896' || 
        profile.programStudy !== 'SISTEM INFORMASI' || 
        profile.faculty !== 'SAINS DAN TEKNOLOGI' ||
        profile.semester !== 4 ||
        profile.currentPhaseLabel !== currentFullPhase;

      if (needsUpdate) {
        const updatedProfile = {
          ...profile,
          nim: '051225896',
          programStudy: 'SISTEM INFORMASI',
          faculty: 'SAINS DAN TEKNOLOGI',
          semester: 4,
          currentPhaseLabel: currentFullPhase, // For dynamic display
          lastAutoSync: new Date().toISOString()
        };
        
        saveUserProfile(userId, updatedProfile).then(() => {
          refreshProfile();
        });
      }
    }
  }, [userId, profile, refreshProfile]);

  return null;
};
