// Office Mafia Moderator Scripts
// Funny corporate-themed scripts for the host to read during gameplay

export interface ModeratorScript {
  id: string;
  title: string;
  content: string;
  phase: 'intro' | 'night' | 'day' | 'elimination' | 'victory_employees' | 'victory_rogue';
}

export const MODERATOR_SCRIPTS: ModeratorScript[] = [
  // Game Introduction
  {
    id: 'game_intro',
    title: 'Welcome to the Office',
    content: `Welcome to another productive day at Goldman Sachs! 
    
You've all received your role assignments via your company devices. Please review your job descriptions carefully.

Unfortunately, we've received reports that some Rogue Employees have infiltrated our organization. They're working to sabotage our quarterly performance and steal our clients' trust.

Your mission: identify and eliminate these corporate threats before they destroy our company culture!

Remember - this is a team-building exercise, so please maintain professional decorum at all times. No actual firing will occur... probably.`,
    phase: 'intro'
  },

  // Night Phase
  {
    id: 'night_phase',
    title: 'After Hours Operations',
    content: `Nice work again today. 

All end-of-day reports are in, and employees have officially logged off.

Everyone please close your eyes.

Everyone has gone home and enjoying some well derserved downtime ... except for 

**Rogue Employees** - Please open your eyes and discuss your sabotage plans silently. Choose one employee to sabotage tonight.

Some employees just can't get enough of work. So  they are still working late at home.

**Audit Department** - Choose one employee to investigate their productivity metrics.

**HR Department** - Choose one employee to provide "performance protection" for tonight.

Alright... the night is over. `,
    phase: 'night'
  },

  // Day Phase 
  {
    id: 'day_phase',
    title: 'Morning Standup Meeting',
    content: `Good morning everyone. Happy Monday/Tuesday/Wednesday.... 

Just got one announcement from leadership to share... It appears one of our valuable employee has been let go 

Official reason: “Cultural misalignment,” “performance concerns,” “budget cuts,” “failure to meet vague KPIs,” 

“refused to attend the 8am sync,” or possibly just “bad vibes"* 

Now, I don’t know about you, but something feels off.

[PLAYER NAME] was loyal, productive, and only cried at work twice last week. 

There must be someone among us sabotaging them. So i will open the discussion to the team. `,
    phase: 'day'
  },

  // Elimination Announcement
  {
    id: 'elimination',
    title: 'Performance Review Results',
    content: `📋 **PERFORMANCE REVIEW COMPLETE**

After thorough evaluation of productivity metrics and team feedback, we've made a difficult but necessary decision.

**[PLAYER NAME]** has been permanently reassigned to "external opportunities" effective immediately. Please pack your desk and surrender your access card.

Their final role was: **[ROLE]**

Security will escort them from the building. We thank them for their service and wish them luck in their future endeavors at competing firms.

The remaining team must continue working together to maintain our corporate excellence!`,
    phase: 'elimination'
  },

  // Employee Victory
  {
    id: 'victory_employees',
    title: '🎉 Company Saved!',
    content: `🏆 **QUARTERLY PERFORMANCE: EXCEEDED EXPECTATIONS**

Congratulations, team! You've successfully identified and eliminated all rogue elements from our organization.

The remaining **Employees**, **Audit Department**, and **HR Department** have worked together to maintain our corporate integrity. Our clients' trust has been preserved, and our quarterly bonuses are secure!

**Final Performance Reviews:**
- Company culture: PRESERVED ✅
- Client relationships: MAINTAINED ✅  
- Rogue employees: ELIMINATED ✅
- Team building exercise: COMPLETED ✅

Please submit your timesheets and enjoy the company-sponsored celebration lunch. Pizza will be provided in the break room.

*Remember: what happens in team building, stays in team building.*`,
    phase: 'victory_employees'
  },

  // Rogue Victory
  {
    id: 'victory_rogue',
    title: '💀 Corporate Takeover Complete',
    content: `🔥 **HOSTILE TAKEOVER SUCCESSFUL**

The rogue employees have seized control of the organization! 

Through strategic sabotage and careful manipulation, they've eliminated enough loyal employees to gain majority control of the company.

**Final Corporate Restructuring:**
- Original employees: DOWNSIZED ❌
- Company assets: REDISTRIBUTED 💰
- Client data: COMPROMISED 🔓
- Rogue employees: PROMOTED TO MANAGEMENT 📈

The remaining rogue employees will now enjoy corner offices, executive parking, and unlimited corporate expense accounts.

To the eliminated employees: Your severance packages are in the mail. Please don't contact HR - they've been restructured too.

*This has been a Goldman Sachs team building exercise. Any resemblance to actual corporate practices is purely coincidental.*`,
    phase: 'victory_rogue'
  }
];

// Get script by phase
export function getScriptByPhase(phase: ModeratorScript['phase']): ModeratorScript | null {
  return MODERATOR_SCRIPTS.find(script => script.phase === phase) || null;
}

// Get all scripts for reference
export function getAllScripts(): ModeratorScript[] {
  return MODERATOR_SCRIPTS;
}

// Check if game is won by employees
export function checkEmployeeVictory(players: any[]): boolean {
  const alive = players.filter(p => p.is_alive);
  const rogueAlive = alive.filter(p => p.role === 'rogue');
  return rogueAlive.length === 0 && alive.length > 0;
}

// Check if game is won by rogue employees  
export function checkRogueVictory(players: any[]): boolean {
  const alive = players.filter(p => p.is_alive);
  const rogueAlive = alive.filter(p => p.role === 'rogue');
  const employeeAlive = alive.filter(p => p.role !== 'rogue');
  
  // Rogue wins if they equal or outnumber other players
  return rogueAlive.length >= employeeAlive.length && rogueAlive.length > 0;
}

// Determine game winner
export function determineGameWinner(players: any[]): 'employees' | 'rogue' | null {
  if (checkEmployeeVictory(players)) return 'employees';
  if (checkRogueVictory(players)) return 'rogue';
  return null;
} 