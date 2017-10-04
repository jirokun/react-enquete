import cuid from 'cuid';
import { List } from 'immutable';
import BaseQuestionDefinition from './internal/BaseQuestionDefinition';
import OutputDefinition from './internal/OutputDefinition';
import ItemDefinition from './internal/ItemDefinition';
import surveyDevIdGeneratorInstance from '../../../SurveyDevIdGenerator';

/** 設問定義：複数選択肢 */
export default class MatrixQuestionDefinition extends BaseQuestionDefinition {
  static create(pageDevId) {
    const questionDevId = surveyDevIdGeneratorInstance.generateForQuestion(pageDevId);
    const itemDevId = surveyDevIdGeneratorInstance.generateForItem(questionDevId);
    const subIDevItemId = surveyDevIdGeneratorInstance.generateForItem(questionDevId);
    return new MatrixQuestionDefinition({
      _id: cuid(),
      devId: questionDevId,
      dataType: 'Matrix',
      matrixType: 'radio',
      items: List().push(ItemDefinition.create(itemDevId, 0)),
      subItems: List().push(ItemDefinition.create(subIDevItemId, 0)),
    });
  }

  /** 出力に使用する名前を取得する */
  getOutputName(item, subItem) {
    const matrixType = this.getMatrixType();
    switch (matrixType) {
      case 'radio':
        return `${this.getId()}_value${item.getIndex() + 1}`;
      case 'checkbox':
      case 'text':
      case 'number':
        return `${this.getId()}_value${item.getIndex() + 1}_${subItem.getIndex() + 1}`;
      default:
        throw new Error(`不明なmatrixTypeです: ${matrixType}`);
    }
  }

  /** 出力に使用する行合計値の名前を取得する */
  getOutputTotalRowName(item) {
    return `${this.getId()}_row${item.getIndex() + 1}_total`;
  }

  /** 出力に使用する列合計値の名前を取得する */
  getOutputTotalColName(item) {
    return `${this.getId()}_column${item.getIndex() + 1}_total`;
  }

  /** タイプごとの出力値を取得する */
  getOutputValue(subItem) {
    const matrixType = this.getMatrixType();
    switch (matrixType) {
      case 'radio':
        return `${subItem.getIndex() + 1}`;
      case 'checkbox':
        return '1';
      case 'text':
      case 'number':
        return '';
      default:
        throw new Error(`不明なmatrixTypeです: ${matrixType}`);
    }
  }

  /** 出力に使用する data-dev-id の値を取得する */
  getOutputDevId(rowDevId, columnDevId) {
    if (rowDevId == null || columnDevId == null) { // devIdが指定されていない場合はnullを返す
      return null;
    }

    const columnLastDevId = columnDevId.split('_').slice(-1)[0];
    return `${rowDevId}_${columnLastDevId}`;
  }

  /** 出力に使用する行合計値の devId を取得する */
  getOutputTotalRowDevId(itemDevId) {
    return `${itemDevId}_total_row`;
  }

  /** 出力に使用する列合計値の devId を取得する */
  getOutputTotalColDevId(itemDevId) {
    return `${itemDevId}_total_column`;
  }

  /** checkbox, text, numberでoutputDefinitionの処理が共通な部分を切り出したメソッド */
  getOutputDefinitionsCommon(pageNo, questionNo) {
    const items = this.isMatrixReverse() ? this.getSubItems() : this.getItems();
    const subItems = this.isMatrixReverse() ? this.getItems() : this.getSubItems();
    return items.flatMap(item =>
      subItems.map((subItem) => {
        const row = item;
        const col = subItem;
        return new OutputDefinition({
          _id: `${item.getId()}_${subItem.getId()}`,
          questionId: this.getId(),
          devId: this.getOutputDevId(row.getDevId(), col.getDevId()),
          name: this.getOutputName(row, col),
          label: `${row.getPlainLabel()}-${col.getPlainLabel()}`,
          dlLabel: `${this.getPlainTitle()}-${row.getPlainLabel()}-${col.getPlainLabel()}`,
          question: this,
          outputType: this.getMatrixType(),
          outputNo: BaseQuestionDefinition.createOutputNo(pageNo, questionNo, row.getIndex() + 1, col.getIndex() + 1),
        });
      }),
    );
  }

  /** OutputDefinitionの合計値分を追加する */
  getOutputDefinitionForSum(pageNo, questionNo, type) {
    if (type === 'rows' && this.isMatrixSumRows()) {
      const items = this.getItems();
      return items.map(item => new OutputDefinition({
        _id: `${item.getId()}_total_row`,
        questionId: this.getId(),
        devId: this.getOutputTotalRowDevId(item.getDevId()),
        name: this.getOutputTotalRowName(item),
        label: `${item.getPlainLabel()}-合計値`,
        dlLabel: `${this.getPlainTitle()}-${item.getPlainLabel()}-合計値`,
        question: this,
        outputType: this.getMatrixType(),
        outputNo: BaseQuestionDefinition.createOutputNo(pageNo, questionNo, `row${item.getIndex() + 1}`, 'total'),
        downloadable: false,
      }));
    }
    if (type === 'columns' && this.isMatrixSumCols()) {
      const items = this.getSubItems();
      return items.map(item => new OutputDefinition({
        _id: `${item.getId()}_total_column`,
        questionId: this.getId(),
        devId: this.getOutputTotalColDevId(item.getDevId()),
        name: this.getOutputTotalColName(item),
        label: `${item.getPlainLabel()}-合計値`,
        dlLabel: `${this.getPlainTitle()}-${item.getPlainLabel()}-合計値`,
        question: this,
        outputType: this.getMatrixType(),
        outputNo: BaseQuestionDefinition.createOutputNo(pageNo, questionNo, `column${item.getIndex() + 1}`, 'total'),
        downloadable: false,
      }));
    }
    return List();
  }

  /** 追加入力のためのOutputDefinitionを取得する */
  getOutputDefinitionForAdditionalInput(pageNo, questionNo, type) {
    const targetItems = type === 'row' ? this.getItems() : this.getSubItems();

    return targetItems.filter(item => item.hasAdditionalInput()).map((item) => {
      const label = `${item.getPlainLabel()}-入力欄`;
      const dlLabel = `${this.getPlainTitle()}-${item.getPlainLabel()}-入力欄`;
      return new OutputDefinition({
        _id: `${item.getId()}_additional_input`,
        questionId: this.getId(),
        devId: `${item.getDevId()}_text`,
        name: `${this.getId()}_value${item.getIndex() + 1}__text`,
        label,
        dlLabel,
        question: this,
        outputType: item.getAdditionalInputType(),
        outputNo: BaseQuestionDefinition.createOutputNo(pageNo, questionNo, `${type}${item.getIndex() + 1}`, 'additional'),
      });
    });
  }

  /** 設問が出力する項目の一覧を返す */
  getOutputDefinitions(pageNo, questionNo) {
    const matrixType = this.getMatrixType();
    const rowAdditionalInputOutputDefinitions = this.getOutputDefinitionForAdditionalInput(pageNo, questionNo, 'row');
    const columnAdditionalInputOutputDefinitions = this.getOutputDefinitionForAdditionalInput(pageNo, questionNo, 'column');
    switch (matrixType) {
      case 'radio': {
        const rowItems = this.isMatrixReverse() ? this.getSubItems() : this.getItems();
        const columnItems = this.isMatrixReverse() ? this.getItems() : this.getSubItems();
        const choices = columnItems.map(item => item.getChoiceDefinition());
        const commonOutputDefinitions = rowItems.map(item => new OutputDefinition({
          _id: item.getId(),
          questionId: this.getId(),
          devId: item.getDevId(),
          name: this.getOutputName(item),
          label: `${item.getPlainLabel()}`,
          dlLabel: `${this.getPlainTitle()}-${item.getPlainLabel()}`,
          question: this,
          outputType: matrixType,
          outputNo: BaseQuestionDefinition.createOutputNo(pageNo, questionNo, item.getIndex() + 1),
          choices,
        }));
        return commonOutputDefinitions.concat(rowAdditionalInputOutputDefinitions).concat(columnAdditionalInputOutputDefinitions);
      }
      case 'checkbox': {
        const commonOutputDefinitions = this.getOutputDefinitionsCommon(pageNo, questionNo);
        return commonOutputDefinitions.concat(rowAdditionalInputOutputDefinitions).concat(columnAdditionalInputOutputDefinitions);
      }
      case 'text':
        return this.getOutputDefinitionsCommon(pageNo, questionNo)
          .concat(rowAdditionalInputOutputDefinitions)
          .concat(columnAdditionalInputOutputDefinitions);
      case 'number': {
        const sumColumnsOutputDefinitions = this.getOutputDefinitionForSum(pageNo, questionNo, 'columns');
        const rowColumnsOutputDefinitions = this.getOutputDefinitionForSum(pageNo, questionNo, 'rows');
        const commonOutputDefinitions = this.getOutputDefinitionsCommon(pageNo, questionNo);
        if (this.isMatrixReverse()) {
          return commonOutputDefinitions
            .concat(sumColumnsOutputDefinitions)
            .concat(rowColumnsOutputDefinitions)
            .concat(rowAdditionalInputOutputDefinitions)
            .concat(columnAdditionalInputOutputDefinitions);
        }
        return commonOutputDefinitions
          .concat(rowColumnsOutputDefinitions)
          .concat(sumColumnsOutputDefinitions)
          .concat(rowAdditionalInputOutputDefinitions)
          .concat(columnAdditionalInputOutputDefinitions);
      }
      default:
        throw new Error(`不明なmatrixTypeです: ${matrixType}`);
    }
  }

  /** indexの値を更新する */
  fixItemIndex() {
    return this.set('items', this.getItems().map((item, i) =>
      item
        .set('index', i)
        .set('value', 'on'),
    ).toList());
  }

  /** indexの値を更新する */
  fixSubItemIndex() {
    return this.set('subItems', this.getSubItems().map((item, i) =>
      item
        .set('index', i)
        .set('value', 'on'),
    ).toList());
  }

  /** 正しく設定されているかチェックする */
  validate(survey) {
    let errors = super.validate(survey);

    const page = survey.findPageFromQuestion(this.getId());
    const node = survey.findNodeFromRefId(page.getId());

    const replacer = survey.getReplacer();
    const outputDefinitions = survey.findPrecedingOutputDefinition(node.getId());
    if (!replacer.validate(this.getItems().map(item => item.getLabel()).join(''), outputDefinitions)) errors = errors.push('行項目で存在しない参照があります');
    if (!replacer.validate(this.getSubItems().map(subItem => subItem.getLabel()).join(''), outputDefinitions)) errors = errors.push('列項目で存在しない参照があります');

    this.getItems().forEach((item) => {
      const itemErrors = item.validate(survey, node, page, this).map(itemError => `行${item.getIndex() + 1} ${itemError}`);
      itemErrors.forEach((error) => { errors = errors.push(error); });
    });
    this.getSubItems().forEach((item) => {
      const itemErrors = item.validate(survey, node, page, this).map(itemError => `列${item.getIndex() + 1} ${itemError}`);
      itemErrors.forEach((error) => { errors = errors.push(error); });
    });

    return errors;
  }
}
