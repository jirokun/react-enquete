/* eslint-env browser */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Popover, Overlay } from 'react-bootstrap';
import { List } from 'immutable';
import moment from 'moment';
import numbro from 'numbro';
import pikaday from 'pikaday';
import Zeroclipboard from 'zeroclipboard';
import Handsontable from 'handsontable';
import HotTable from 'react-handsontable';
import S from 'string';
import $ from 'jquery';
import debounce from 'throttle-debounce/debounce';
import 'handsontable/dist/handsontable.full.css';
import * as EditorActions from '../../../actions';
import IndividualNumberValidationRuleEditorPart from './IndividualNumberValidationRuleEditorPart';

class NumberValidationEditorPart extends Component {
  constructor(props) {
    super(props);

    // OutputDefinitionが変わったらインスタンスが変更されるため、キャッシュしてしまって問題ない
    this.numberTypeOutputDefinitions = this.getOutputDefinitionsFromThisQuestionOfNumberType();
    this.state = {
      showIndividualValidationDialog: false,
      targetOutputDefinition: null,
    };
  }

  componentDidMount() {
    if (!this.hotRootEl) return;
    const setting = this.isMatrixNumber() ? this.createSettingForMatrixNumber() : this.createSettingForOthers();
    this.hotInstance = new Handsontable(this.hotRootEl, setting);
    $(this.hotRootEl).on('click', '.validation-setting-button', this.handleShowIndividualValidationDialog.bind(this));
    this.resizeHotTable();
  }

  componentWillUnmount() {
    this.hotInstance.destroy();
    delete this.hotInstance;
  }

  /** 制限のセルレンダラー */
  validationRenderer(instance, td, row, col, prop, numberValidationRuleId) {
    const { survey, page, question } = this.props;
    const numberValidationRule = question.findNumberValidationRule(numberValidationRuleId);
    const targetOutputDefinition = this.findOutputDefinitionFrom(row, col);
    // targetOutputDefinitionがなければなにも描画しない
    if (!targetOutputDefinition) {
      // td要素は使いまわされる可能性があるので、描画しない場合は空にしておく
      td.innerHTML = '';
      return;
    }

    if (numberValidationRule) {
      const validationType = numberValidationRule.getValidationTypeInQuestion();
      const hasError = numberValidationRule.validate(survey, page, question).size > 0;

      // エラー有り無しを設定
      if (hasError) $(td).addClass('htInvalid');
      else $(td).removeClass('htInvalid');

      td.innerHTML = `<button type="button" class="btn btn-default btn-xs validation-setting-button" data-output-definition-id="${targetOutputDefinition.getId()}">設定</button> 制限${validationType}`;
    } else {
      td.innerHTML = `<button type="button" class="btn btn-default btn-xs validation-setting-button" data-output-definition-id="${targetOutputDefinition.getId()}">設定</button>`;
    }
    return td;
  }

  isMatrixNumber() {
    const { question } = this.props;
    return question.getDataType() === 'Matrix' && question.getMatrixType() === 'number';
  }

  /** handsontableの行番号と列番号から対象となるoutputDefinitionを取得する */
  findOutputDefinitionFrom(row, col) {
    const { survey, page, question } = this.props;
    // Matrixの数値
    if (this.isMatrixNumber()) {
      if (col >= question.getSubItems().size) { // 行の合計値の場合
        const pageNo = survey.calcPageNo(page.getId());
        const outputDefinitionForSums = question.getOutputDefinitionForSum(pageNo, survey.calcQuestionNo(page.getId(), question.getId()), 'rows');
        return outputDefinitionForSums.get(row);
      } else if (row >= question.getItems().size) { // 列の合計値の場合
        const pageNo = survey.calcPageNo(page.getId());
        const outputDefinitionForSums = question.getOutputDefinitionForSum(pageNo, survey.calcQuestionNo(page.getId(), question.getId()), 'columns');
        return outputDefinitionForSums.get(col);
      } else { // 合計値以外の場合
        return this.numberTypeOutputDefinitions.find(od => od.getName() === question.getOutputName(question.getItems().get(row), question.getSubItems().get(col)));
      }
    }
    const numberTypeOutputDefinitions = this.getOutputDefinitionsFromThisQuestionOfNumberType();
    return numberTypeOutputDefinitions.get(row);
  }

  /** このメソッドが呼ばれるのはdeleteをした場合と、コピペした場合のみ */
  handleAfterChange(changes, source) {
    if (source === 'loadData' || source === 'individual' || !this.hotInstance) return;
    const { page, question, copyNumberValidationRules } = this.props;
    // バリデーション列の値だけを抜き出す
    const hotInstance = this.hotInstance;
    const copyData = [];
    for (let row = 0, len = hotInstance.countRows(); row < len; row++) {
      for (let col = 0, colLen = hotInstance.countCols(); col < colLen; col++) {
        // Matrix以外は全て2行目にしかデータがないのでパス
        if (!this.isMatrixNumber() && col !== 1) continue;
        const outputDefinition = this.findOutputDefinitionFrom(row, col);

        // 合計の一番右下は対象外
        if (!outputDefinition) continue;

        const newNumberValidationRuleId = hotInstance.getDataAtCell(row, col);
        const newNumberValidationRule = question.findNumberValidationRule(newNumberValidationRuleId);
        const numberValidationRuleList = question.getNumberValidationRuleMap().get(outputDefinition.getId());
        const oldNumberValidationRuleId = numberValidationRuleList ? numberValidationRuleList.get(0).getId() : null;

        // 変更されていなければ更新のリストに入れない
        if (oldNumberValidationRuleId === newNumberValidationRuleId) continue;

        if (!newNumberValidationRule) {
          copyData.push({
            col,
            row,
            targetOutputDefinitionId: outputDefinition.getId(),
            sourceNumberValidationRuleId: null,
          });
        } else {
          copyData.push({
            col,
            row,
            targetOutputDefinitionId: outputDefinition.getId(),
            sourceNumberValidationRuleId: newNumberValidationRuleId,
          });
        }
      }
    }
    if (copyData.length === 0) return;
    copyNumberValidationRules(page.getId(), question.getId(), copyData);
    // nextTickではreducerが実行済みであり、propsにはコピーされた最新のデータが入っている。
    // そのデータを使って更新された箇所のデータを設定し直す
    setTimeout(() => {
      if (this.isMatrixNumber()) {
        const setting = this.createSettingForMatrixNumber();
        const newData = setting.data;
        copyData.forEach((data) => {
          hotInstance.setDataAtCell(data.row, data.col, newData[data.row][data.col], 'individual');
        });
      } else {
        const setting = this.createSettingForOthers();
        const newData = setting.data;
        hotInstance.loadData(newData);
      }
    }, 1);
  }

  handleUpdateCell(outputDefinitionId, numberValidationRuleId) {
    // すでにunmountされていたら何もしない
    if (!this.hotInstance) return;
    const hotInstance = this.hotInstance;
    for (let row = 0, len = hotInstance.countRows(); row < len; row++) {
      for (let col = 0, colLen = hotInstance.countCols(); col < colLen; col++) {
        // Matrix以外は全て2行目にしかデータがないのでパス
        if (!this.isMatrixNumber() && col !== 1) continue;
        const outputDefinition = this.findOutputDefinitionFrom(row, col);

        // 合計の一番右下は対象外
        if (!outputDefinition) continue;
        // 変更対象でないセルの場合はなにもしない
        if (outputDefinitionId !== outputDefinition.getId()) continue;

        hotInstance.setDataAtCell(row, col, numberValidationRuleId, 'individual');
        return;
      }
    }
  }

  getOutputDefinitionsFromThisQuestion() {
    const { survey, page, question } = this.props;
    const pageNo = survey.calcPageNo(page.getId());
    return question.getOutputDefinitions(pageNo, survey.calcQuestionNo(page.getId(), question.getId()));
  }

  getOutputDefinitionsFromThisQuestionOfNumberType() {
    return this.getOutputDefinitionsFromThisQuestion().filter(od => od.getOutputType() === 'number');
  }

  handleShowIndividualValidationDialog(e) {
    const outputDefintionId = $(e.target).data('output-definition-id');
    const outputDefinitions = this.getOutputDefinitionsFromThisQuestionOfNumberType();
    const targetOutputDefinition = outputDefinitions.find(od => od.getId() === outputDefintionId);
    this.setState({
      showIndividualValidationDialog: true,
      targetOutputDefinitionId: targetOutputDefinition.getId(),
      popoverTarget: $(e.target).parents('td')[0],
    });
    // overlayが自動的に閉じてしまうのでstopPropagationする
    e.stopPropagation();
  }

  handleClose() {
    this.setState({ showIndividualValidationDialog: false });
  }

  resizeHotTable() {
    if (!this.hotRootEl || !this.hotInstance) return;
    const height = $(this.hotRootEl).find('.ht_master .wtHider').height() + 20;
    this.hotInstance.updateSettings({ height });
  }

  createSettingForMatrixNumber() {
    const { survey, page, question } = this.props;

    // columnの定義
    const column = { renderer: this.validationRenderer.bind(this), editor: null };
    const baseColumns = question.getSubItems().map(() => column);
    const hotColumns = question.isMatrixSumRows() ? baseColumns.push(column) : baseColumns; // 合計値も考慮

    // 行の合計のOutputDefinitionを用意
    const pageNo = survey.calcPageNo(page.getId());
    const questionNo = survey.calcQuestionNo(page.getId(), question.getId());
    const rowSumOutputDefinitions = question.getOutputDefinitionForSum(pageNo, questionNo, 'rows');

    // 列の合計のOutputDefinitionを用意
    const colSumOutputDefinitions = question.getOutputDefinitionForSum(pageNo, questionNo, 'columns');

    // データの生成。2次元配列
    const baseData = question.getItems().map((item, itemIndex) => {
      const numberValidationRuleIds = question.getSubItems().map((subItem) => {
        const outputDefinition = this.numberTypeOutputDefinitions.find(od => od.getName() === question.getOutputName(item, subItem));
        const numberValidationRules = question.getNumberValidationRuleMap().get(outputDefinition.getId());
        return numberValidationRules ? numberValidationRules.get(0).getId() : null;
      });
      if (!question.isMatrixSumRows()) return numberValidationRuleIds.toArray();
      // 行の合計を表示する場合
      const sumOutputDefinition = rowSumOutputDefinitions.get(itemIndex);
      const numberValidationRules = question.getNumberValidationRuleMap().get(sumOutputDefinition.getId());
      return (numberValidationRules ? numberValidationRuleIds.push(numberValidationRules.get(0).getId()) : numberValidationRuleIds).toArray();
    });

    // データの生成
    let data = baseData;
    if (question.isMatrixSumCols()) { // 列の合計を表示する場合
      const sumColsData = colSumOutputDefinitions.map((od) => {
        const numberValidationRules = question.getNumberValidationRuleMap().get(od.getId());
        return numberValidationRules ? numberValidationRules.get(0).getId() : null;
      });
      data = baseData.push(sumColsData.toArray());
    }

    const baseColHeaders = question.getSubItems().map(item => item.getLabel());
    const colHeaders = question.isMatrixSumRows() ? baseColHeaders.push('合計') : baseColHeaders;
    const baseRowHeaders = question.getItems().map(item => item.getLabel());
    const rowHeaders = question.isMatrixSumCols() ? baseRowHeaders.push('合計') : baseRowHeaders;

    return {
      data: data.toArray(),
      width: 500,
      columns: hotColumns.toJS(),
      colHeaders: colHeaders.toJS(),
      rowHeaders: rowHeaders.toJS(),
      rowHeaderWidth: 150,
      colWidths: hotColumns.map(() => 100).toArray(),
      afterLoadData: () => this.resizeHotTable(),
      afterChange: (changes, source) => this.handleAfterChange(changes, source),
      allowInsertRow: false,
      allowInsertColumn: false,
      fillHandle: false,
    };
  }

  createSettingForOthers() {
    const { question } = this.props;
    const data = this.numberTypeOutputDefinitions.map((od) => {
      const numberValidationRules = question.getNumberValidationRuleMap().get(od.getId());
      const numberValidationRuleId = numberValidationRules ? numberValidationRules.get(0).getId() : null;
      return {
        outputDefinitionId: od.getId(),
        label: od.getLabel(),
        numberValidationRuleId,
      };
    }).toJS();

    // HotTableのColumn
    const columns = [
      // 対象選択肢の定義
      { data: 'label', readOnly: true },
      // 条件設問の定義
      {
        data: 'numberValidationRuleId',
        renderer: this.validationRenderer.bind(this),
        editor: null,
      },
    ];

    return {
      data,
      width: 500,
      columns,
      colHeaders: ['対象選択肢', 'バリデーション'],
      rowHeaderWidth: 150,
      afterLoadData: this.resizeHotTable.bind(this),
      afterChange: this.handleAfterChange.bind(this),
      allowInsertRow: false,
      allowInsertColumn: false,
      fillHandle: false,
    };
  }

  render() {
    const { page, question } = this.props;

    return (
      <div className="number-validation-editor-part">
        <div ref={(el) => { this.hotRootEl = el || this.hotRootEl; }} className="item-validation-editor" />
        <Overlay
          show={this.state.showIndividualValidationDialog}
          target={this.state.popoverTarget}
          placement="right"
          container={document.body}
          onHide={() => this.handleClose()}
          rootClose
        >
          <Popover id="number-validation-editor-popover" className="individual-number-validation-popover">
            <IndividualNumberValidationRuleEditorPart
              key={`${this.state.targetOutputDefinitionId}_individualValidationDialogPart`}
              onHide={() => this.handleClose()}
              onUpdate={(outputDefinitionId, numberValidationRuleId) => this.handleUpdateCell(outputDefinitionId, numberValidationRuleId)}
              className="individual-validation-dialog"
              page={page}
              question={question}
              outputDefinitionId={this.state.targetOutputDefinitionId}
            />
          </Popover>
        </Overlay>
      </div>
    );
  }
}

const stateToProps = state => ({
  survey: state.getSurvey(),
  runtime: state.getRuntime(),
  view: state.getViewSetting(),
  options: state.getOptions(),
});
const actionsToProps = dispatch => ({
  copyNumberValidationRules: (pageId, questionId, copyData) =>
    dispatch(EditorActions.copyNumberValidationRules(pageId, questionId, copyData)),
});

export default connect(
  stateToProps,
  actionsToProps,
)(NumberValidationEditorPart);
