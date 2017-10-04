import React, { Component } from 'react';
import S from 'string';
import classNames from 'classnames';
import TransformQuestion from './TransformQuestion';
import QuestionDetail from '../parts/QuestionDetail';
import { parseInteger } from '../../../utils';

/** CheckboxQuestion, RadioQuestionの基底クラス */
export default class ChoiceQuestionBase extends TransformQuestion {
  /** itemのcheckedが変更されたときのハンドラ */
  handleItemCheckedChange(e) {
    const { model } = this.state;
    const responseItemIndexStr = e.target.getAttribute('data-response-item-index'); // IE9のためにdatasetは使わない
    const itemIndex = parseInteger(responseItemIndexStr);
    this.setState({ model: model.setItemState(itemIndex, e.target.checked) });
  }

  /** itemを描画する */
  createItems(containerId) {
    const { survey, runtime, replacer, question, options } = this.props;
    const { model } = this.state;
    const items = model.getTransformedItems();
    if (items.size === 0) {
      throw new Error('items attribute is not defined');
    }
    return items.map(item => (
      <Item
        key={`${question.getId()}_${item.getIndex()}`}
        containerId={containerId}
        survey={survey}
        runtime={runtime}
        question={question}
        inputType={this.inputType}
        item={item} // itemDefitionのインスタンス
        itemState={model.getItemStateByItemIndex(item.getIndex())}
        handleItemCheckedChange={e => this.handleItemCheckedChange(e)}
        replacer={replacer}
        options={options}
      />
    ));
  }

  /** 描画 */
  render() {
    const { replacer, question, options } = this.props;
    const title = question.getTitle();
    const description = question.getDescription();
    const containerId = `${question.getId()}-list-container`;
    return (
      <div className="ChoiceQuestionBase">
        {S(title).isEmpty() ? null : <h2 className="question-title" data-dev-id-label={question.getDevId()} dangerouslySetInnerHTML={{ __html: replacer.id2Span(title) }} />}
        {S(description).isEmpty() ?
          null : <h3 className="question-description" dangerouslySetInnerHTML={{ __html: replacer.id2Span(description) }} />}
        <div className="question">
          <ul id={containerId} className="checkbox validation-hover-target">
            {this.createItems(containerId)}
          </ul>
        </div>
        { options.isShowDetail() && question.getDataType() !== 'ScreeningAgreement' ? (
          <QuestionDetail
            question={question}
            random
            minCheckCount={question.getDataType() === 'Checkbox'}
            maxCheckCount={question.getDataType() === 'Checkbox'}
          />) : null }
      </div>
    );
  }
}

/**
 * itemに対応するコンポーネント
 * RadioかCheckboxのいずれかが対応する
 */
class Item extends Component {
  /** additionalInputを描画する */
  createAdditionalInput(itemState, item, question, errorContainerId) {
    if (!item.hasAdditionalInput()) return null;
    const { survey, replacer } = this.props;
    const type = item.getAdditionalInputType();
    const disabled = !itemState.get('checked') || itemState.get('disabled');
    const name = question.getOutputName(item.getIndex(), true);
    const unit = item.getUnit();

    return (
      <span>
        <input
          type="text"
          pattern={type === 'number' ? '\\d*' : null}
          maxLength={type === 'number' ? 16 : 100}
          name={name}
          data-parsley-errors-container={`#${errorContainerId}`}
          data-output-no={survey.findOutputNoFromName(name)}
          data-parsley-required
          data-parsley-positive-integer={type === 'number' ? true : null}
          disabled={disabled}
          className={classNames('additionalInput', { disabled, number: type === 'number' })}
          onClick={e => e.preventDefault()}
        />
        <span dangerouslySetInnerHTML={{ __html: replacer.id2Span(unit) }} />
      </span>
    );
  }

  createItemDetail() {
    const { question, item, options } = this.props;
    if (!options.isShowDetail()) return null;

    return (
      <div className="item-detail">
        {question.isRandom() && item.isRandomFixed() ? <span className="detail-function">ランダム固定</span> : null}
        {item.isExclusive() ? <span className="detail-function">排他</span> : null}
      </div>
    );
  }

  render() {
    const { survey, runtime, options, replacer, containerId, itemState, item, question, inputType, handleItemCheckedChange } = this.props;

    const label = item.getLabel();
    const disabled = !!itemState.get('disabled');
    const className = classNames('question-form-list', {
      disabled,
      [item.calcVisibilityClassName(survey, runtime.getAnswers())]: !options.isVisibilityConditionDisabled(),
    });
    const value = item.getValue();
    const dataType = question.getDataType();
    const showItemDetail = options.isShowDetail() && (item.isRandomFixed() || item.isExclusive());
    const name = question.getOutputName(item.getIndex(), false);
    const errorContainerId = `${item.getId()}_error_container`;

    return (
      <li className={className} data-row-order={item.getIndex() + 1}>
        <label className={classNames('question-form-list-label', { 'detail-shown': showItemDetail })}>
          <input
            className="question-form-list-input"
            type={inputType}
            name={name}
            value={value}
            checked={itemState.get('checked')}
            onChange={handleItemCheckedChange}
            disabled={disabled}
            data-output-no={survey.findOutputNoFromName(name)}
            data-response-key="checked"
            data-response-multiple={inputType === 'checkbox'}
            data-response-item-index={item.getIndex()}
            data-parsley-class-handler={`#${containerId}`}
            data-parsley-required={question.getMinCheckCount() > 0}
            data-parsley-mincheck={dataType === 'Checkbox' && question.getMinCheckCount() !== 0 ? question.getMinCheckCount() : null}
            data-parsley-maxcheck={dataType === 'Checkbox' && question.getMaxCheckCount() !== 0 ? question.getMaxCheckCount() : null}
            data-parsley-maxcheck-message="%s 個以下で選択してください"
            data-parsley-multiple={question.getId()}
          />
          <span className="select-tool" dangerouslySetInnerHTML={{ __html: replacer.id2Span(label) }} />
          {this.createAdditionalInput(itemState, item, question, errorContainerId)}
          {this.createItemDetail()}
          <span id={errorContainerId} />
        </label>
      </li>
    );
  }
}
