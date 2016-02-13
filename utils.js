import CheckboxItem from './runtime/components/items/CheckboxItem'
import RadioItem from './runtime/components/items/RadioItem'
import TextItem from './runtime/components/items/TextItem'

/**
 * Itemを探す
 *
 * まず最初にitemsを探し、その後windowを探す
 */
export function findItemConstructor(name) {
  let items = {
    CheckboxItem,
    RadioItem,
    TextItem
  };
  if (items[name]) return items[name];
  else if (typeof(window) !== 'undefined' && window[name]) return window[name];
  else throw 'Item is not defined: ' + name;
}

/** stateからflowを探す */
export function findFlow(state, flowId) {
  return state.defs.flowDefs.find((def) => def.id === flowId);
}
/** stateからpageを探す */
export function findPage(state, pageId) {
  return state.defs.pageDefs.find((def) => def.id === pageId);
}
/** stateからquestionを探す */
export function findQuestion(state, questionId) {
  return state.defs.questionDefs.find((def) => def.id === questionId);
}
/** stateからpageIdに紐つくquestionを探す */
export function findQuestions(state, pageId) {
  return state.defs.questionDefs.filter((def) => def.pageId === pageId);
}
/** stateからquestionIdに紐つくitemを探す */
export function findItems(state, questionId) {
  return state.defs.itemDefs.filter((def) => def.questionId === questionId);
}
/** stateからitemIdに紐つくchoiceを探す */
export function findChoices(state, itemId) {
  return state.defs.choiceDefs.filter((def) => def.itemId === itemId);
}
/** stateからconditionを探す */
export function findConditions(state, flowId) {
  return state.defs.conditionDefs.filter((def) => def.flowId === flowId);
}
/** ユニークとなるflowIdを返す */
export function nextFlowId(state) {
  let i = 0;
  while (true) {
    let nextId = `flow${i++}`;
    if (findFlow(state, nextId) == null) {
      return nextId;
    }
  }
}
/** flowIdからpositionを取得する */
export function findPosition(state, flowId) {
  const { positionDefs } = state.defs;
  return positionDefs.find((pos) => {
    return pos.flowId === flowId;
  });
}
/** flowDefs,condionDefsからcytoscape用のelementsを作成する */
export function makeCytoscapeElements(state) {
  const { flowDefs, condionDefs } = state.defs;
  const elements = flowDefs.map((def) => {
    let pos = findPosition(state, def.id);
    if (!pos) {
      pos = {x: 0, y: 0};
    }
    return {
      data: {
        id: def.id,
        label: `${def.id} (${def.pageId})`
      },
      position: { x: pos.x, y: pos.y },
      classes: def.type === 'branch' ? 'branch' : 'page'
    };
  });
  const edges = flowDefs.map((def) => {
    if (def.type === 'page') {
      // sourceが入っているとedgeとして解釈されてしまうため
      // pageかつnextflowIdが定義されてない場合はここでは作成しない。
      // 後でfilterする
      if (!def.nextFlowId || def.nextFlowId === '') return null; 
      return {
        data: {
          source: def.id,
          target: def.nextFlowId
        }
      };
    } else if (def.type === 'branch') {
      const conditionDefs = findConditions(state, def.id);
      const ret = conditionDefs.map((c) => {
        return {
          data: {
            label: `${c.question}==${c.value}`,
            source: def.id,
            target: c.nextFlowId
          }
        }
      });
      return ret;
    }
  }).filter((edge) => { return edge !== null });
  const mergedElements = elements.concat(flatten(edges));
  return mergedElements.filter((e) => { return e != null; });
}

export function flatten(ary) {
  return ary.reduce(function (p, c) {
    return Array.isArray(c) ? p.concat(flatten(c)) : p.concat(c);
  }, []);
}
/** オブジェクトをcloneする */
export function cloneObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}
