import { defineStore } from 'pinia';

const SURVIVOR_NAMES = [
  '张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵磊', '黄敏',
  '周杰', '吴婷', '徐浩', '孙悦', '马超', '朱琳', '胡军', '郭静',
  '林峰', '何雪', '高翔', '罗梅', '郑凯', '梁晴', '谢涛', '唐丽'
];

const SURVIVOR_AVATARS = ['👨', '👩', '👴', '👵', '🧑', '👱', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱'];

export const ROLES = {
  IDLE: 'idle',
  GATHER: 'gather',
  GUARD: 'guard',
  HEAL: 'heal'
};

export const ROLE_INFO = {
  [ROLES.IDLE]: { name: '空闲', icon: '😴', desc: '未分配任务，休息恢复体力' },
  [ROLES.GATHER]: { name: '采集', icon: '🧺', desc: '外出采集食物、水和木材' },
  [ROLES.GUARD]: { name: '守夜', icon: '🛡️', desc: '守护营地，降低风险事件概率' },
  [ROLES.HEAL]: { name: '治疗', icon: '💊', desc: '治疗伤病成员，加快恢复' }
};

const randomName = () => SURVIVOR_NAMES[Math.floor(Math.random() * SURVIVOR_NAMES.length)];
const randomAvatar = () => SURVIVOR_AVATARS[Math.floor(Math.random() * SURVIVOR_AVATARS.length)];

const createSurvivor = (overrides = {}) => {
  const gatherSkill = Math.floor(Math.random() * 5) + 1;
  const guardSkill = Math.floor(Math.random() * 5) + 1;
  const healSkill = Math.floor(Math.random() * 5) + 1;
  return {
    id: Date.now() + Math.random(),
    name: randomName(),
    avatar: randomAvatar(),
    role: ROLES.IDLE,
    health: 100,
    stamina: 100,
    morale: 80 + Math.floor(Math.random() * 20),
    skills: {
      gather: gatherSkill,
      guard: guardSkill,
      heal: healSkill
    },
    injured: false,
    joinedAt: new Date().toISOString(),
    ...overrides
  };
};

export default defineStore('survivor', {
  state: () => ({
    list: [
      createSurvivor({ name: '你', avatar: '🧑', skills: { gather: 3, guard: 3, heal: 2 } }),
      createSurvivor()
    ],
    recruitCooldown: 0,
    recruitCost: { food: 30, water: 20 }
  }),

  getters: {
    totalCount: (state) => state.list.length,
    idleCount: (state) => state.list.filter(s => s.role === ROLES.IDLE && !s.injured).length,
    gatherCount: (state) => state.list.filter(s => s.role === ROLES.GATHER && !s.injured).length,
    guardCount: (state) => state.list.filter(s => s.role === ROLES.GUARD && !s.injured).length,
    healCount: (state) => state.list.filter(s => s.role === ROLES.HEAL && !s.injured).length,
    injuredCount: (state) => state.list.filter(s => s.injured).length,
    averageMorale: (state) => {
      if (state.list.length === 0) return 0;
      return Math.round(state.list.reduce((sum, s) => sum + s.morale, 0) / state.list.length);
    },
    gatherBonus: (state) => {
      return state.list
        .filter(s => s.role === ROLES.GATHER && !s.injured)
        .reduce((sum, s) => sum + s.skills.gather, 0);
    },
    guardBonus: (state) => {
      return state.list
        .filter(s => s.role === ROLES.GUARD && !s.injured)
        .reduce((sum, s) => sum + s.skills.guard, 0);
    },
    healBonus: (state) => {
      return state.list
        .filter(s => s.role === ROLES.HEAL && !s.injured)
        .reduce((sum, s) => sum + s.skills.heal, 0);
    },
    canRecruit: (state) => {
      return state.recruitCooldown <= 0;
    }
  },

  actions: {
    recruitSurvivor() {
      if (this.recruitCooldown > 0) {
        return { success: false, message: '招募冷却中，请稍后再试' };
      }
      const newSurvivor = createSurvivor();
      this.list.push(newSurvivor);
      this.recruitCooldown = 3;
      return { success: true, survivor: newSurvivor };
    },

    assignRole(survivorId, role) {
      const survivor = this.list.find(s => s.id === survivorId);
      if (!survivor) {
        return { success: false, message: '未找到该幸存者' };
      }
      if (survivor.injured) {
        return { success: false, message: '该成员受伤中，无法执行任务' };
      }
      const oldRole = survivor.role;
      survivor.role = role;
      return { success: true, oldRole, newRole: role, survivor };
    },

    applyDamage(survivorId, damage) {
      const survivor = this.list.find(s => s.id === survivorId);
      if (!survivor) return;
      survivor.health = Math.max(0, survivor.health - damage);
      if (survivor.health <= 30) {
        survivor.injured = true;
        survivor.role = ROLES.IDLE;
      }
      survivor.morale = Math.max(0, survivor.morale - 10);
    },

    healSurvivors(amount) {
      const healers = this.list.filter(s => s.role === ROLES.HEAL && !s.injured);
      const injured = this.list.filter(s => s.injured);
      const healPerHealer = healers.length > 0 ? amount / healers.length : 0;
      
      injured.forEach(survivor => {
        survivor.health = Math.min(100, survivor.health + healPerHealer * 2);
        if (survivor.health >= 70) {
          survivor.injured = false;
        }
        survivor.morale = Math.min(100, survivor.morale + 5);
      });

      this.list.forEach(survivor => {
        if (!survivor.injured && survivor.role !== ROLES.HEAL) {
          survivor.health = Math.min(100, survivor.health + amount * 0.3);
        }
      });
    },

    consumeStamina() {
      this.list.forEach(survivor => {
        if (survivor.role === ROLES.GATHER) {
          survivor.stamina = Math.max(0, survivor.stamina - 8);
        } else if (survivor.role === ROLES.GUARD) {
          survivor.stamina = Math.max(0, survivor.stamina - 5);
        } else if (survivor.role === ROLES.HEAL) {
          survivor.stamina = Math.max(0, survivor.stamina - 3);
        } else {
          survivor.stamina = Math.min(100, survivor.stamina + 10);
          survivor.morale = Math.min(100, survivor.morale + 2);
        }

        if (survivor.stamina <= 20) {
          survivor.morale = Math.max(0, survivor.morale - 5);
        }
      });
    },

    consumeResourcesPerPerson() {
      const count = this.list.length;
      return {
        food: count * 2,
        water: count * 2
      };
    },

    tickCooldown() {
      if (this.recruitCooldown > 0) {
        this.recruitCooldown--;
      }
    },

    randomInjury(damage = 20) {
      const activeWorkers = this.list.filter(s => s.role !== ROLES.IDLE && !s.injured);
      if (activeWorkers.length === 0) return null;
      const victim = activeWorkers[Math.floor(Math.random() * activeWorkers.length)];
      this.applyDamage(victim.id, damage);
      return victim;
    },

    moraleBoost(amount = 5) {
      this.list.forEach(survivor => {
        survivor.morale = Math.min(100, survivor.morale + amount);
      });
    },

    moraleDrop(amount = 10) {
      this.list.forEach(survivor => {
        survivor.morale = Math.max(0, survivor.morale - amount);
      });
    }
  }
});
