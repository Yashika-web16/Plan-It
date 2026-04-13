import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle2, Circle, Loader2, Sparkles, Trophy, Camera, Send, X, Image as ImageIcon, MessageSquare, User } from 'lucide-react';
import { GlassCard, cn } from './GlassCard';
import { ScavengerMission, ScavengerSubmission, LeaderboardEntry } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

interface ScavengerHuntSectionProps {
  eventId: string; // This is the bookingId/planId
  missions: ScavengerMission[];
  currentUser?: { uid: string; displayName: string; photoURL?: string };
  isOrganizer?: boolean;
}

export const ScavengerHuntSection: React.FC<ScavengerHuntSectionProps> = ({ 
  eventId, 
  missions, 
  currentUser,
  isOrganizer = false 
}) => {
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedMission, setSelectedMission] = useState<ScavengerMission | null>(null);
  const [proofType, setProofType] = useState<'image' | 'text'>('text');
  const [proofValue, setProofValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'missions' | 'leaderboard' | 'scorecard'>('missions');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    // Listen to all submissions for this event
    const q = query(
      collection(db, 'scavenger_submissions'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScavengerSubmission));
      setSubmissions(subs);

      // Check if user has already finished
      const finishedSub = subs.find(s => s.userId === currentUser?.uid && s.missionId === 'FINAL_SCORECARD');
      if (finishedSub) setIsFinished(true);

      // Calculate leaderboard
      const scores: Record<string, LeaderboardEntry> = {};
      subs.forEach(sub => {
        if (sub.status === 'approved' || sub.status === 'pending') { // Count points if approved or pending (optimistic)
          if (!scores[sub.userId]) {
            scores[sub.userId] = {
              userId: sub.userId,
              userName: sub.userName,
              userPhoto: sub.userPhoto,
              totalPoints: 0,
              completedCount: 0
            };
          }
          if (sub.status === 'approved') {
            scores[sub.userId].totalPoints += sub.pointsAwarded;
            scores[sub.userId].completedCount += 1;
          }
        }
      });

      const sortedLeaderboard = Object.values(scores).sort((a, b) => b.totalPoints - a.totalPoints);
      setLeaderboard(sortedLeaderboard);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scavenger_submissions');
    });

    return () => unsubscribe();
  }, [eventId]);

  const handleSubmitProof = async () => {
    if (!currentUser || !selectedMission || !proofValue.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'scavenger_submissions'), {
        eventId,
        missionId: selectedMission.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous Guest',
        userPhoto: currentUser.photoURL || '',
        proofType,
        proofValue,
        pointsAwarded: selectedMission.points,
        status: 'pending', // In a real app, an organizer might approve this
        createdAt: new Date().toISOString()
      });
      setSelectedMission(null);
      setProofValue('');
      alert("Proof submitted! Points will be awarded once approved. 🚀");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scavenger_submissions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishHunt = async () => {
    if (!currentUser || isFinished) return;
    
    const confirmFinish = window.confirm("Are you sure you want to submit your final scorecard? You won't be able to add more proof after this!");
    if (!confirmFinish) return;

    setSubmitting(true);
    try {
      const approvedSubs = submissions.filter(s => s.userId === currentUser.uid && s.status === 'approved');
      const totalPoints = approvedSubs.reduce((acc, s) => acc + s.pointsAwarded, 0);

      await addDoc(collection(db, 'scavenger_submissions'), {
        eventId,
        missionId: 'FINAL_SCORECARD',
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous Guest',
        userPhoto: currentUser.photoURL || '',
        proofType: 'text',
        proofValue: `Final Scorecard Submitted. Total Points: ${totalPoints}`,
        pointsAwarded: totalPoints, // Store the total points here for easy awarding
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setIsFinished(true);
      alert("Final scorecard submitted! 🏆 The host will announce the winners soon.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scavenger_submissions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAwardPoints = async (submission: ScavengerSubmission) => {
    if (!isOrganizer) return;
    
    setSubmitting(true);
    try {
      // 1. Update submission status to approved
      await updateDoc(doc(db, 'scavenger_submissions', submission.id), {
        status: 'approved'
      });

      // 2. Award points to user profile (if they are a registered user)
      const userRef = doc(db, 'users', submission.userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          points: increment(submission.pointsAwarded)
        });
        alert(`Awarded ${submission.pointsAwarded} points to ${submission.userName}! 🎁`);
      } else {
        alert(`Approved! (Note: ${submission.userName} is a guest and doesn't have a profile to store points yet)`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'scavenger_submissions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveMission = async (submission: ScavengerSubmission) => {
    if (!isOrganizer) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'scavenger_submissions', submission.id), {
        status: 'approved'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'scavenger_submissions');
    } finally {
      setSubmitting(false);
    }
  };

  const isMissionCompleted = (missionId: string) => {
    return submissions.some(s => s.userId === currentUser?.uid && s.missionId === missionId && s.status === 'approved');
  };

  const isMissionPending = (missionId: string) => {
    return submissions.some(s => s.userId === currentUser?.uid && s.missionId === missionId && s.status === 'pending');
  };

  return (
    <div className="space-y-6">
      {!currentUser && (
        <GlassCard className="p-4 border-brand-primary/30 bg-brand-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-brand-primary" />
            <p className="text-sm font-medium">Login to join the hunt and earn points!</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-xs font-bold uppercase tracking-widest text-brand-primary hover:underline"
          >
            Login Now
          </button>
        </GlassCard>
      )}

      <div className="flex gap-2 p-1 glass rounded-full w-fit">
        <button
          onClick={() => setView('missions')}
          className={cn(
            "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
            view === 'missions' ? "bg-white text-black" : "text-white/40 hover:text-white"
          )}
        >
          Missions
        </button>
        <button
          onClick={() => setView('leaderboard')}
          className={cn(
            "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
            view === 'leaderboard' ? "bg-white text-black" : "text-white/40 hover:text-white"
          )}
        >
          Leaderboard
        </button>
        {currentUser && (
          <button
            onClick={() => setView('scorecard')}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
              view === 'scorecard' ? "bg-white text-black" : "text-white/40 hover:text-white"
            )}
          >
            Scorecard
          </button>
        )}
        {isOrganizer && (
          <button
            onClick={() => setView('admin' as any)}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
              (view as any) === 'admin' ? "bg-brand-primary text-white" : "text-white/40 hover:text-white"
            )}
          >
            Review
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'missions' ? (
          <motion.div
            key="missions"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid gap-4"
          >
            {missions.map((mission) => {
              const completed = isMissionCompleted(mission.id);
              const pending = isMissionPending(mission.id);
              
              return (
                <button
                  key={mission.id}
                  onClick={() => !completed && !pending && setSelectedMission(mission)}
                  disabled={completed || pending || !currentUser}
                  className={cn(
                    "w-full flex items-center gap-6 p-6 rounded-[2rem] border transition-all text-left group relative overflow-hidden",
                    completed ? "bg-brand-primary/10 border-brand-primary/30 opacity-60" : 
                    pending ? "bg-brand-secondary/10 border-brand-secondary/30" :
                    "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                    completed ? "bg-brand-primary text-white" : 
                    pending ? "bg-brand-secondary text-white" :
                    "bg-white/5 text-white/20 group-hover:bg-white/10"
                  )}>
                    {completed ? <CheckCircle2 className="w-6 h-6" /> : 
                     pending ? <Loader2 className="w-6 h-6 animate-spin" /> :
                     <Circle className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn("text-lg font-bold", completed && "line-through text-white/40")}>{mission.mission}</h4>
                      <span className="mono-tag text-[10px]">{mission.points} PTS</span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">{mission.description}</p>
                  </div>
                  
                  {!completed && !pending && currentUser && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-brand-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>
        ) : view === 'leaderboard' ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div>
                  <h3 className="text-2xl font-bold">Leaderboard</h3>
                  <p className="text-white/40 text-sm">Top hunters of the event</p>
                </div>
              </div>

              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div 
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                      entry.userId === currentUser?.uid ? "bg-brand-primary/10 border-brand-primary/30" : "bg-white/5 border-white/10"
                    )}
                  >
                    <div className="w-8 text-center font-display font-bold text-white/20">
                      #{i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                      {entry.userPhoto ? (
                        <img src={entry.userPhoto} alt={entry.userName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{entry.userName}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{entry.completedCount} Missions Done</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-brand-primary">{entry.totalPoints}</p>
                      <p className="text-[8px] text-white/20 uppercase tracking-widest">Points</p>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center py-10 text-white/20">
                    No points awarded yet. Be the first! 🏹
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ) : (view as any) === 'admin' ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Pending Missions */}
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 px-2">Pending Missions</h4>
              <div className="space-y-3">
                {submissions.filter(s => s.status === 'pending' && s.missionId !== 'FINAL_SCORECARD').map(sub => (
                  <div key={sub.id} className="glass p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                        {sub.userPhoto ? <img src={sub.userPhoto} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{sub.userName}</p>
                        <p className="text-[10px] text-white/40">{missions.find(m => m.id === sub.missionId)?.mission}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-white/60 italic">"{sub.proofValue}"</p>
                      </div>
                      <button 
                        onClick={() => handleApproveMission(sub)}
                        className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500 transition-all hover:text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {submissions.filter(s => s.status === 'pending' && s.missionId !== 'FINAL_SCORECARD').length === 0 && (
                  <p className="text-center py-8 text-white/20 text-sm italic">No pending missions to review.</p>
                )}
              </div>
            </section>

            {/* Final Scorecards */}
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 px-2">Final Scorecards</h4>
              <div className="space-y-3">
                {submissions.filter(s => s.missionId === 'FINAL_SCORECARD').map(sub => (
                  <div key={sub.id} className={cn(
                    "glass p-6 rounded-3xl border flex items-center justify-between",
                    sub.status === 'approved' ? "border-green-500/30 bg-green-500/5" : "border-brand-primary/30 bg-brand-primary/5"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                        {sub.userPhoto ? <img src={sub.userPhoto} className="w-full h-full object-cover" /> : <User className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-lg font-bold">{sub.userName}</p>
                        <p className="text-xs text-white/40">Submitted {new Date(sub.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-brand-primary">{sub.pointsAwarded} PTS</p>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest">Total Score</p>
                      </div>
                      {sub.status === 'pending' ? (
                        <button 
                          onClick={() => handleAwardPoints(sub)}
                          className="btn-primary py-2 px-6 text-xs"
                        >
                          Award Points
                        </button>
                      ) : (
                        <div className="px-4 py-2 rounded-lg bg-green-500/20 text-green-500 text-[10px] font-bold uppercase">
                          Points Awarded
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {submissions.filter(s => s.missionId === 'FINAL_SCORECARD').length === 0 && (
                  <p className="text-center py-8 text-white/20 text-sm italic">No final scorecards submitted yet.</p>
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="scorecard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <GlassCard className="p-8 text-center">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-brand-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Your Scorecard</h3>
              <p className="text-white/40 text-sm mb-8">Review your progress and submit your final score to the host.</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total Points</p>
                  <p className="text-3xl font-bold text-brand-primary">
                    {submissions.filter(s => s.userId === currentUser?.uid && s.status === 'approved').reduce((acc, s) => acc + s.pointsAwarded, 0)}
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Missions</p>
                  <p className="text-3xl font-bold text-brand-secondary">
                    {submissions.filter(s => s.userId === currentUser?.uid && s.status === 'approved').length} / {missions.length}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-left mb-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 px-2">Approved Submissions</h4>
                {submissions.filter(s => s.userId === currentUser?.uid && s.status === 'approved').map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-medium">{missions.find(m => m.id === sub.missionId)?.mission || 'Mission'}</p>
                    </div>
                    <span className="text-xs font-bold text-brand-primary">+{sub.pointsAwarded}</span>
                  </div>
                ))}
                {submissions.filter(s => s.userId === currentUser?.uid && s.status === 'approved').length === 0 && (
                  <p className="text-center py-4 text-white/20 text-sm italic">No approved missions yet.</p>
                )}
              </div>

              {isFinished ? (
                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500 font-bold">
                  Final Scorecard Submitted! 🚀
                </div>
              ) : (
                <button
                  onClick={handleFinishHunt}
                  disabled={submitting}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
                  Finish & Submit Scorecard
                </button>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof Submission Modal */}
      <AnimatePresence>
        {selectedMission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMission(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-dark rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedMission(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{selectedMission.mission}</h3>
                <p className="text-white/40 text-sm">{selectedMission.description}</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                  <button
                    onClick={() => setProofType('text')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                      proofType === 'text' ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                    )}
                  >
                    <MessageSquare className="w-4 h-4" /> Text Proof
                  </button>
                  <button
                    onClick={() => setProofType('image')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
                      proofType === 'image' ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                    )}
                  >
                    <ImageIcon className="w-4 h-4" /> Image URL
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                    {proofType === 'text' ? 'Describe what you did' : 'Paste Image URL'}
                  </label>
                  {proofType === 'text' ? (
                    <textarea
                      value={proofValue}
                      onChange={(e) => setProofValue(e.target.value)}
                      placeholder="I found the hidden treasure near the..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-h-[120px] focus:outline-none focus:border-brand-primary transition-colors text-sm"
                    />
                  ) : (
                    <input
                      type="url"
                      value={proofValue}
                      onChange={(e) => setProofValue(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-sm"
                    />
                  )}
                </div>

                <button
                  onClick={handleSubmitProof}
                  disabled={submitting || !proofValue.trim()}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Submit Proof
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
