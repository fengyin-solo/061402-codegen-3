<template>
  <div class="island-container">
    <div class="island-header">
      <h1>🏝️ 海岛生存</h1>
      <p>在荒岛上建立你的生存基地，招募幸存者共同求生</p>
    </div>

    <div class="island-main">
      <div class="stats-panel">
        <div class="stat-card">
          <div class="stat-icon">🍖</div>
          <div class="stat-content">
            <div class="stat-number">{{ resources.food }}</div>
            <div class="stat-label">食物</div>
            <div v-if="gatherRate > 0" class="stat-rate positive">+{{ gatherRate }}/周期</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💧</div>
          <div class="stat-content">
            <div class="stat-number">{{ resources.water }}</div>
            <div class="stat-label">淡水</div>
            <div v-if="gatherRate > 0" class="stat-rate positive">+{{ Math.round(gatherRate * 1.5) }}/周期</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🪵</div>
          <div class="stat-content">
            <div class="stat-number">{{ resources.wood }}</div>
            <div class="stat-label">木材</div>
            <div v-if="gatherRate > 0" class="stat-rate positive">+{{ Math.round(gatherRate * 0.8) }}/周期</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⛏️</div>
          <div class="stat-content">
            <div class="stat-number">{{ resources.stone }}</div>
            <div class="stat-label">石头</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-number">{{ survivorStore.totalCount }}</div>
            <div class="stat-label">幸存者</div>
            <div class="stat-morale">士气: {{ survivorStore.averageMorale }}%</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🛡️</div>
          <div class="stat-content">
            <div class="stat-number">{{ survivorStore.guardCount }}</div>
            <div class="stat-label">守夜中</div>
            <div class="stat-defense">防御: +{{ survivorStore.guardBonus }}</div>
          </div>
        </div>
      </div>

      <div class="survivor-panel">
        <div class="panel-header">
          <h3>👥 幸存者管理</h3>
          <el-button type="primary" :icon="Plus" @click="handleRecruit" :disabled="!survivorStore.canRecruit">
            招募幸存者
            <span v-if="!survivorStore.canRecruit" class="cooldown-badge">
              ({{ survivorStore.recruitCooldown }}周期)
            </span>
          </el-button>
        </div>

        <div class="role-summary">
          <div class="role-item" v-for="(info, key) in ROLE_INFO" :key="key">
            <span class="role-icon">{{ info.icon }}</span>
            <span class="role-name">{{ info.name }}</span>
            <span class="role-count" :class="key">
              {{ key === 'idle' ? survivorStore.idleCount : '' }}
              {{ key === 'gather' ? survivorStore.gatherCount : '' }}
              {{ key === 'guard' ? survivorStore.guardCount : '' }}
              {{ key === 'heal' ? survivorStore.healCount : '' }}
            </span>
          </div>
          <div class="role-item">
            <span class="role-icon">🤕</span>
            <span class="role-name">受伤</span>
            <span class="role-count injured">{{ survivorStore.injuredCount }}</span>
          </div>
        </div>

        <div class="survivor-list">
          <div v-for="survivor in survivorStore.list" :key="survivor.id"
               class="survivor-card" :class="{ injured: survivor.injured }">
            <div class="survivor-avatar">
              {{ survivor.avatar }}
              <span v-if="survivor.injured" class="injured-badge">🤕</span>
            </div>
            <div class="survivor-info">
              <div class="survivor-name">{{ survivor.name }}</div>
              <div class="survivor-stats">
                <div class="stat-bar">
                  <span class="stat-bar-label">❤️</span>
                  <div class="stat-bar-track">
                    <div class="stat-bar-fill health" :style="{ width: survivor.health + '%' }"></div>
                  </div>
                  <span class="stat-bar-value">{{ survivor.health }}</span>
                </div>
                <div class="stat-bar">
                  <span class="stat-bar-label">⚡</span>
                  <div class="stat-bar-track">
                    <div class="stat-bar-fill stamina" :style="{ width: survivor.stamina + '%' }"></div>
                  </div>
                  <span class="stat-bar-value">{{ survivor.stamina }}</span>
                </div>
                <div class="stat-bar">
                  <span class="stat-bar-label">😊</span>
                  <div class="stat-bar-track">
                    <div class="stat-bar-fill morale" :style="{ width: survivor.morale + '%' }"></div>
                  </div>
                  <span class="stat-bar-value">{{ survivor.morale }}</span>
                </div>
              </div>
              <div class="survivor-skills">
                <span class="skill-tag" title="采集技能">🧺{{ survivor.skills.gather }}</span>
                <span class="skill-tag" title="守夜技能">🛡️{{ survivor.skills.guard }}</span>
                <span class="skill-tag" title="治疗技能">💊{{ survivor.skills.heal }}</span>
              </div>
            </div>
            <div class="survivor-role-select">
              <div class="current-role">
                <span>{{ ROLE_INFO[survivor.role].icon }}</span>
                <span>{{ ROLE_INFO[survivor.role].name }}</span>
              </div>
              <el-select v-model="survivor.role" size="small" @change="(val) => handleAssignRole(survivor.id, val)"
                         :disabled="survivor.injured" style="width: 100px;">
                <el-option v-for="(info, key) in ROLE_INFO" :key="key" :label="info.icon + ' ' + info.name"
                           :value="key" :disabled="survivor.injured" />
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <div class="actions-panel">
        <h3>📋 可执行操作</h3>

        <div class="action-grid">
          <div class="action-card" @click="gatherFood">
            <div class="action-icon">🍓</div>
            <div class="action-title">采集食物</div>
            <div class="action-desc">在岛上寻找可食用的果实和动物</div>
            <div class="action-time">耗时: 30秒</div>
          </div>

          <div class="action-card" @click="collectWater">
            <div class="action-icon">💧</div>
            <div class="action-title">收集淡水</div>
            <div class="action-desc">收集雨水或净化海水</div>
            <div class="action-time">耗时: 1分钟</div>
          </div>

          <div class="action-card" @click="chopWood">
            <div class="action-icon">🪓</div>
            <div class="action-title">砍伐木材</div>
            <div class="action-desc">砍伐树木获取木材资源</div>
            <div class="action-time">耗时: 2分钟</div>
          </div>

          <div class="action-card" @click="mineStone">
            <div class="action-icon">⛏️</div>
            <div class="action-title">挖掘石头</div>
            <div class="action-desc">在岛上挖掘石头资源</div>
            <div class="action-time">耗时: 3分钟</div>
          </div>

          <div class="action-card" @click="buildShelter">
            <div class="action-icon">🏠</div>
            <div class="action-title">建造庇护所</div>
            <div class="action-desc">建造一个安全的住所</div>
            <div class="action-cost">需要: 50木材, 30石头</div>
          </div>

          <div class="action-card" @click="craftTools">
            <div class="action-icon">🔨</div>
            <div class="action-title">制作工具</div>
            <div class="action-desc">制作更高效的生存工具</div>
            <div class="action-cost">需要: 20木材, 10石头</div>
          </div>
        </div>
      </div>

      <div class="map-panel">
        <h3>🗺️ 海岛地图</h3>
        <div class="map-container">
          <div class="map-grid">
            <div v-for="(cell, index) in mapGrid" :key="index"
                 :class="'map-cell ' + cell.type + (cell.explored ? ' explored' : '')"
                 @click="exploreCell(index)">
              {{ cell.icon }}
            </div>
          </div>
          <div class="map-legend">
            <div class="legend-item">
              <span class="legend-icon">🌳</span>
              <span>森林</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🏔️</span>
              <span>山地</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🌊</span>
              <span>海洋</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🏠</span>
              <span>营地</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="message-log">
      <h3>📜 生存日志</h3>
      <div class="log-list">
        <div v-for="(msg, index) in messageLog" :key="index" class="log-item" :class="msg.type">
          <span class="log-time">{{ msg.time }}</span>
          <span class="log-content">{{ msg.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { useSurvivorStore, ROLES, ROLE_INFO } from '../store';

const survivorStore = useSurvivorStore();

const resources = ref({
  food: 100,
  water: 100,
  wood: 100,
  stone: 100
});

const messageLog = ref([
  { time: '00:00', content: '你来到了一个荒岛，开始你的生存之旅吧！', type: 'info' }
]);

const mapGrid = ref([
  { type: 'forest', icon: '🌳', explored: true },
  { type: 'forest', icon: '🌳', explored: true },
  { type: 'mountain', icon: '🏔️', explored: false },
  { type: 'ocean', icon: '🌊', explored: false },
  { type: 'camp', icon: '🏠', explored: true },
  { type: 'forest', icon: '🌳', explored: false },
  { type: 'ocean', icon: '🌊', explored: false },
  { type: 'mountain', icon: '🏔️', explored: false },
  { type: 'forest', icon: '🌳', explored: false }
]);

const gatherRate = computed(() => {
  return survivorStore.gatherBonus * 2 + survivorStore.gatherCount * 3;
});

const addMessage = (content, type = 'info') => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  messageLog.value.push({ time, content, type });
  if (messageLog.value.length > 30) {
    messageLog.value.shift();
  }
};

const handleRecruit = () => {
  if (resources.value.food < survivorStore.recruitCost.food || resources.value.water < survivorStore.recruitCost.water) {
    ElMessage.error(`资源不足！招募需要 ${survivorStore.recruitCost.food} 食物和 ${survivorStore.recruitCost.water} 淡水`);
    return;
  }
  ElMessageBox.confirm(
    `招募新幸存者需要消耗 ${survivorStore.recruitCost.food} 食物和 ${survivorStore.recruitCost.water} 淡水，是否继续？`,
    '招募幸存者',
    {
      confirmButtonText: '确认招募',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    resources.value.food -= survivorStore.recruitCost.food;
    resources.value.water -= survivorStore.recruitCost.water;
    const result = survivorStore.recruitSurvivor();
    if (result.success) {
      addMessage(`🎉 招募了新幸存者 ${result.survivor.avatar} ${result.survivor.name} 加入营地！`, 'success');
      ElMessage.success(`招募成功！${result.survivor.name} 加入了你的队伍`);
    } else {
      ElMessage.warning(result.message);
    }
  }).catch(() => {});
};

const handleAssignRole = (survivorId, role) => {
  const result = survivorStore.assignRole(survivorId, role);
  if (result.success) {
    const survivor = result.survivor;
    const oldName = ROLE_INFO[result.oldRole].name;
    const newName = ROLE_INFO[result.newRole].name;
    addMessage(`${survivor.avatar} ${survivor.name} 从「${oldName}」调整为「${newName}」`, 'info');
  } else {
    ElMessage.warning(result.message);
  }
};

const performAction = (name, cost, gain, time) => {
  for (const [resource, amount] of Object.entries(cost)) {
    if (resources.value[resource] < amount) {
      ElMessage.error(`资源不足，无法${name}`);
      return false;
    }
  }

  for (const [resource, amount] of Object.entries(cost)) {
    resources.value[resource] -= amount;
  }

  addMessage(`开始${name}...`, 'info');

  setTimeout(() => {
    for (const [resource, amount] of Object.entries(gain)) {
      resources.value[resource] += amount;
    }
    const gainText = Object.entries(gain).map(([k, v]) => `${v}${k}`).join('、');
    if (gainText) {
      addMessage(`${name}完成！获得了${gainText}`, 'success');
    } else {
      addMessage(`${name}完成！`, 'success');
    }
    ElMessage.success(`${name}完成！`);
  }, time);

  return true;
};

const gatherFood = () => {
  const bonus = survivorStore.gatherCount > 0 ? survivorStore.gatherCount * 5 : 0;
  performAction('采集食物', {}, { food: 20 + bonus }, 30000);
};

const collectWater = () => {
  const bonus = survivorStore.gatherCount > 0 ? survivorStore.gatherCount * 8 : 0;
  performAction('收集淡水', {}, { water: 30 + bonus }, 60000);
};

const chopWood = () => {
  const bonus = survivorStore.gatherCount > 0 ? survivorStore.gatherCount * 4 : 0;
  performAction('砍伐木材', {}, { wood: 15 + bonus }, 120000);
};

const mineStone = () => {
  performAction('挖掘石头', {}, { stone: 10 }, 180000);
};

const buildShelter = () => {
  if (performAction('建造庇护所', { wood: 50, stone: 30 }, {}, 300000)) {
    addMessage('🏠 庇护所建造完成！大家的士气提升了。', 'success');
    survivorStore.moraleBoost(10);
  }
};

const craftTools = () => {
  if (performAction('制作工具', { wood: 20, stone: 10 }, {}, 120000)) {
    addMessage('🔨 工具制作完成！采集效率提高了。', 'success');
  }
};

const triggerRiskEvent = () => {
  const guardBonus = survivorStore.guardBonus;
  const baseRisk = 0.35;
  const riskChance = Math.max(0.05, baseRisk - guardBonus * 0.04);

  if (Math.random() > riskChance) {
    if (survivorStore.guardCount > 0) {
      addMessage(`🛡️ 守夜队员成功警戒，阻止了一次潜在危险！`, 'success');
    }
    return;
  }

  const eventTypes = [
    {
      name: '野兽袭击',
      icon: '🐺',
      effect: () => {
        const victim = survivorStore.randomInjury(25);
        if (victim) {
          addMessage(`🐺 野兽闯入营地！${victim.avatar} ${victim.name} 在抵抗中受伤了。`, 'danger');
          resources.value.food = Math.max(0, resources.value.food - 15);
        } else {
          addMessage(`🐺 野兽闯入营地偷走了一些食物！`, 'warning');
          resources.value.food = Math.max(0, resources.value.food - 20);
        }
      }
    },
    {
      name: '暴风雨',
      icon: '⛈️',
      effect: () => {
        resources.value.wood = Math.max(0, resources.value.wood - 20);
        resources.value.water = Math.max(0, resources.value.water - 10);
        survivorStore.moraleDrop(8);
        addMessage(`⛈️ 一场暴风雨袭击了营地，损失了一些物资，大家士气低落。`, 'danger');
      }
    },
    {
      name: '疾病传播',
      icon: '🤒',
      effect: () => {
        if (survivorStore.healCount > 0) {
          addMessage(`🤒 营地里有人感到不适，但治疗员及时处理，没有造成大碍。`, 'warning');
        } else {
          const victim = survivorStore.randomInjury(30);
          if (victim) {
            addMessage(`🤒 疾病在营地蔓延！${victim.avatar} ${victim.name} 病倒了，急需治疗员。`, 'danger');
          }
        }
      }
    },
    {
      name: '意外事故',
      icon: '⚠️',
      effect: () => {
        const victim = survivorStore.randomInjury(15);
        if (victim) {
          addMessage(`⚠️ ${victim.avatar} ${victim.name} 在工作中发生意外，受了轻伤。`, 'warning');
        }
      }
    },
    {
      name: '意外收获',
      icon: '🎁',
      effect: () => {
        const bonus = 15 + survivorStore.gatherBonus * 3;
        resources.value.food += bonus;
        resources.value.water += Math.round(bonus * 0.8);
        survivorStore.moraleBoost(5);
        addMessage(`🎁 幸存者在外出时发现了一处废弃补给点，获得了额外的食物和淡水！`, 'success');
      }
    }
  ];

  const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  event.effect();
};

const gameTick = () => {
  survivorStore.tickCooldown();

  if (survivorStore.gatherCount > 0) {
    const foodGain = gatherRate.value;
    const waterGain = Math.round(gatherRate.value * 1.5);
    const woodGain = Math.round(gatherRate.value * 0.8);
    resources.value.food += foodGain;
    resources.value.water += waterGain;
    resources.value.wood += woodGain;
    addMessage(
      `🧺 采集队产出：+${foodGain}食物 +${waterGain}淡水 +${woodGain}木材`,
      'success'
    );
  }

  if (survivorStore.healCount > 0) {
    const healAmount = survivorStore.healBonus * 3;
    survivorStore.healSurvivors(healAmount);
    if (survivorStore.injuredCount > 0) {
      addMessage(`💊 治疗员正在照料伤员，恢复了${healAmount}点生命值。`, 'info');
    }
  }

  survivorStore.consumeStamina();

  const consumption = survivorStore.consumeResourcesPerPerson();
  resources.value.food = Math.max(0, resources.value.food - consumption.food);
  resources.value.water = Math.max(0, resources.value.water - consumption.water);
  addMessage(`🍽️ 全员消耗：-${consumption.food}食物 -${consumption.water}淡水`, 'info');

  triggerRiskEvent();

  if (resources.value.food <= 0) {
    addMessage('⚠️ 食物耗尽！幸存者开始挨饿，士气大幅下降。', 'danger');
    survivorStore.moraleDrop(15);
    survivorStore.randomInjury(10);
  }
  if (resources.value.water <= 0) {
    addMessage('⚠️ 淡水耗尽！幸存者口渴难耐，士气大幅下降。', 'danger');
    survivorStore.moraleDrop(15);
    survivorStore.randomInjury(10);
  }
};

const exploreCell = (index) => {
  const cell = mapGrid.value[index];
  if (cell.explored) {
    ElMessage.info('这个区域已经探索过了');
    return;
  }

  ElMessageBox.confirm(
    `确定要探索这个区域吗？可能会遇到危险或发现资源。`,
    '探索未知区域',
    {
      confirmButtonText: '开始探索',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    addMessage(`开始探索${cell.icon}区域...`, 'info');

    setTimeout(() => {
      cell.explored = true;

      const random = Math.random();
      if (random < 0.25) {
        const foodGain = Math.floor(Math.random() * 20) + 10 + survivorStore.gatherBonus * 2;
        resources.value.food += foodGain;
        addMessage(`🍎 探索发现了食物！获得${foodGain}食物`, 'success');
        ElMessage.success(`探索发现了食物！获得${foodGain}食物`);
      } else if (random < 0.5) {
        const woodGain = Math.floor(Math.random() * 15) + 5 + survivorStore.gatherBonus;
        resources.value.wood += woodGain;
        addMessage(`🪵 探索发现了木材！获得${woodGain}木材`, 'success');
        ElMessage.success(`探索发现了木材！获得${woodGain}木材`);
      } else if (random < 0.7) {
        const stoneGain = Math.floor(Math.random() * 10) + 5;
        resources.value.stone += stoneGain;
        addMessage(`⛏️ 探索发现了石头！获得${stoneGain}石头`, 'success');
        ElMessage.success(`探索发现了石头！获得${stoneGain}石头`);
      } else if (random < 0.85) {
        addMessage(`👀 你在远处看到了一个人影...也许可以招募？`, 'info');
        survivorStore.recruitCooldown = Math.max(0, survivorStore.recruitCooldown - 1);
        ElMessage.info('你发现了幸存者的踪迹，招募冷却时间减少！');
      } else {
        resources.value.food -= 10;
        resources.value.water -= 10;
        const victim = survivorStore.randomInjury(15);
        if (victim) {
          addMessage(`⚔️ 探索遇到了危险！${victim.avatar} ${victim.name} 受伤，损失了10食物和10水`, 'danger');
        } else {
          addMessage(`⚔️ 探索遇到了危险！损失了10食物和10水`, 'danger');
        }
        ElMessage.warning('探索遇到了危险！');
      }
    }, 5000);
  }).catch(() => {
    addMessage('取消了探索', 'info');
  });
};

onMounted(() => {
  addMessage('欢迎来到海岛生存游戏！合理分配幸存者的工作，让大家活下去。', 'info');

  setInterval(() => {
    gameTick();
  }, 30000);
});
</script>

<style scoped>
.island-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.island-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.island-header h1 {
  font-size: 48px;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.island-header p {
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
}

.island-main {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 40px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.stat-rate,
.stat-morale,
.stat-defense {
  font-size: 12px;
}

.stat-rate.positive {
  color: #67c23a;
}

.stat-morale {
  color: #e6a23c;
}

.stat-defense {
  color: #409eff;
}

.survivor-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 22px;
  color: #333;
}

.cooldown-badge {
  font-size: 12px;
  opacity: 0.85;
}

.role-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 14px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.role-icon {
  font-size: 20px;
}

.role-name {
  color: #606266;
}

.role-count {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
  background: #909399;
  color: white;
  min-width: 24px;
  text-align: center;
  font-size: 12px;
}

.role-count.gather {
  background: #67c23a;
}

.role-count.guard {
  background: #409eff;
}

.role-count.heal {
  background: #e6a23c;
}

.role-count.idle {
  background: #909399;
}

.role-count.injured {
  background: #f56c6c;
}

.survivor-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}

.survivor-card {
  display: flex;
  gap: 14px;
  padding: 14px;
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  transition: all 0.2s;
  background: #fafbfc;
}

.survivor-card:hover {
  border-color: #667eea;
  background: #fff;
}

.survivor-card.injured {
  border-color: #f56c6c;
  background: #fef0f0;
}

.survivor-avatar {
  font-size: 44px;
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.injured-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 20px;
}

.survivor-info {
  flex: 1;
  min-width: 0;
}

.survivor-name {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.survivor-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.stat-bar-label {
  width: 16px;
}

.stat-bar-track {
  flex: 1;
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.stat-bar-fill.health {
  background: linear-gradient(90deg, #f56c6c, #f78989);
}

.stat-bar-fill.stamina {
  background: linear-gradient(90deg, #409eff, #79bbff);
}

.stat-bar-fill.morale {
  background: linear-gradient(90deg, #e6a23c, #f3d19e);
}

.stat-bar-value {
  width: 28px;
  text-align: right;
  color: #909399;
}

.survivor-skills {
  display: flex;
  gap: 6px;
}

.skill-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
}

.survivor-role-select {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  justify-content: center;
}

.current-role {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.actions-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.actions-panel h3 {
  margin: 0 0 20px 0;
  font-size: 22px;
  color: #333;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.action-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.action-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.action-title {
  font-size: 17px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.action-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.action-time,
.action-cost {
  font-size: 12px;
  color: #999;
}

.map-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.map-panel h3 {
  margin: 0 0 20px 0;
  font-size: 22px;
  color: #333;
}

.map-container {
  text-align: center;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  gap: 10px;
  justify-content: center;
  margin-bottom: 24px;
}

.map-cell {
  width: 100px;
  height: 100px;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #ddd;
  filter: grayscale(0.8);
  opacity: 0.7;
}

.map-cell:hover {
  transform: scale(1.05);
  border-color: #667eea;
  filter: grayscale(0);
  opacity: 1;
}

.map-cell.explored {
  background: #e8f4fa;
  border-color: #409eff;
  filter: grayscale(0);
  opacity: 1;
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-icon {
  font-size: 22px;
}

.message-log {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.message-log h3 {
  margin: 0 0 20px 0;
  font-size: 22px;
  color: #333;
}

.log-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
}

.log-item {
  display: flex;
  margin-bottom: 6px;
  padding: 8px 10px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  border-left: 3px solid #909399;
}

.log-item.success {
  background: #f0f9eb;
  border-left-color: #67c23a;
}

.log-item.warning {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.log-item.danger {
  background: #fef0f0;
  border-left-color: #f56c6c;
}

.log-item.info {
  background: #f4f4f5;
  border-left-color: #909399;
}

.log-time {
  font-weight: bold;
  color: #409eff;
  margin-right: 12px;
  min-width: 60px;
  flex-shrink: 0;
}

.log-content {
  flex: 1;
  color: #606266;
  word-break: break-word;
}

@media (max-width: 768px) {
  .island-header h1 {
    font-size: 32px;
  }

  .stats-panel {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .survivor-list {
    grid-template-columns: 1fr;
  }
}
</style>
