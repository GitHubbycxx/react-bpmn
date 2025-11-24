import React, { useEffect, useState } from 'react';
import { Tabs, Collapse, Space, Typography } from 'antd';
import ElementBaseInfo from '@/bpmn/panel/ElementBaseInfo/ElementBaseInfo';

import ElementDocument from '@/bpmn/panel/ElementDocument/ElementDocument';
import ExtensionProperties from '@/bpmn/panel/ExtensionProperties/ExtensionProperties';
import SignalMessage from '@/bpmn/panel/SignalMessage/SignalMessage';
import ElementListener from '@/bpmn/panel/ElementListener/ElementListener';
import ElementTask from '@/bpmn/panel/ElementTask/ElementTask';
import MultiInstance from '@/bpmn/panel/MultiInstance/MultiInstance';
import ElementForm from '@/bpmn/panel/ElementForm/ElementForm';
import './PropertyPanel.less';
import {
  AppstoreOutlined,
  AuditOutlined,
  BellOutlined,
  BulbTwoTone,
  DatabaseTwoTone,
  DeploymentUnitOutlined,
  FileOutlined,
  FileTextOutlined,
  FileTwoTone,
  FireOutlined,
  InfoCircleOutlined,
  NodeIndexOutlined,
  NotificationOutlined,
  OrderedListOutlined,
  RetweetOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { initBpmnInstance } from '@/bpmn/util/windowUtil';
import { useAppSelector } from '@/redux/hook/hooks';
import FlowCondition from '@/bpmn/panel/FlowCondition/FlowCondition';

interface IProps {
  modeler: any;
}

const { TabPane } = Tabs;
/**
 * 属性面板
 * @param props
 * @constructor
 */
export default function PropertyPanel(props: IProps) {
  // props属性
  const { modeler } = props;
  // state
  const [element, setElement] = useState<any>();
  const [businessObject, setBusinessObject] = useState<any>();
  const [modeling, setModeling] = useState<any>();
  const [bpmnFactory, setBpmnFactory] = useState<any>();
  const [moddle, setModdel] = useState<any>();
  const [rootElements, setRootElements] = useState([]);
  // redux
  const processId = useAppSelector((state) => state.bpmn.processId);
  const colorPrimary = useAppSelector((state) => state.theme.colorPrimary);

  /**
   * 初始化
   */
  useEffect(() => {
    initBpmnInstance();
    // 避免初始化，流程图未加载完导致出错
    if (modeler) {
      init();
    }
  }, [processId]);

  /**
   * 初始化时,设置监听器
   * 1.这部分不直接放到 init() 方法里,是为了防止在用户主动修改processId时,产生多个监听器
   * 2.特别注意: 监听器只能设置一次，如果执行多次，会设置多个监听器,浪费资源
   */
  useEffect(() => {
    // 避免初始化，流程图未加载完导致出错
    if (modeler) {
      // 设置监听器，监听所有工作就绪后，默认选中process节点 (TODO 2022/12/4 注意:没有找到关于 import.done 事件,目前这段代码是没有执行到的,先放这里吧)
      modeler?.on('import.done', (e: any) => {
        confirmCurrentElement(null);
        // 获取rootElements
        setRootElements(modeler.getDefinitions().rootElements);
        window.bpmnInstance.rootElements =
          modeler.getDefinitions().rootElements;
      });
      // 设置监听器，监听选中节点变化 (特别注意：监听器只能设置一次，如果执行多次，会设置多个监听器)
      modeler?.on('selection.changed', (e: any) => {
        confirmCurrentElement(e.newSelection[0] || null);
      });
      // 设置监听器，监听当前节点属性变化
      modeler?.on('element.changed', ({ element }: any) => {
        if (
          element &&
          element.id === window.bpmnInstance.element.businessObject.id
        ) {
          confirmCurrentElement(element);
        }
      });
    }
  }, [modeler]);

  function init() {
    console.log('【初始化bpmn实例】2、初始化,设置实际值');
    // 设置window的bpmnInstance对象属性
    window.bpmnInstance.modeler = modeler;
    window.bpmnInstance.elementRegistry = modeler.get('elementRegistry');
    window.bpmnInstance.modeling = modeler.get('modeling', true);
    window.bpmnInstance.bpmnFactory = modeler.get('bpmnFactory', true);
    window.bpmnInstance.moddle = modeler.get('moddle', true);
    console.log('【初始化bpmn实例】3、初始化完成');

    // 获取modeling
    setModeling(modeler.get('modeling', true));
    // 获取bpmnFactory
    setBpmnFactory(modeler.get('bpmnFactory', true));
    // 获取moddle
    setModdel(modeler.get('moddle', true));

    //设置默认选中流程process节点
    confirmCurrentElement(null);
  }

  /**
   * 确认当前选中节点
   * @param element
   */
  function confirmCurrentElement(element: any) {
    // 如果element为空，则设置流程节点为当前节点，否则设置选中节点为当前节点 (点击canvas空白处默认指流程节点)
    if (!element) {
      // 查询流程节点的id,并通过id获取流程节点
      const newId = modeler.getDefinitions().rootElements[0].id;
      let processElement: any = modeler.get('elementRegistry').get(newId);
      setElement(processElement);
      window.bpmnInstance.element = processElement;
      setBusinessObject(
        JSON.parse(JSON.stringify(processElement?.businessObject || null)),
      );
      return;
    }
    window.bpmnInstance.element = element;
    setBusinessObject(JSON.parse(JSON.stringify(element.businessObject)));
    setElement(element);
  }

  /**
   * 渲染 常规信息 组件
   * 1、所有节点都有
   */
  function renderElementBaseInfo() {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <InfoCircleOutlined twoToneColor={colorPrimary} />
            &nbsp;常规信息
          </Typography>
        }
        key={1}
        // // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementBaseInfo businessObject={businessObject} />
      </Collapse.Panel>
    );
  }

  /**
   * 渲染 流转条件 组件
   */
  function renderFlowCondition() {
    let conditionFormVisible: boolean = !!(
      element?.type === 'bpmn:SequenceFlow' &&
      element?.source &&
      element?.source?.type?.indexOf('StartEvent') === -1
    );
    if (conditionFormVisible) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
              <RetweetOutlined twoToneColor={colorPrimary} />
              &nbsp;流转条件
            </Typography>
          }
          key={12}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <FlowCondition businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 消息与信号 组件
   * 1、只有 Process 有
   */
  function renderSignalMessage() {
    if (element?.type === 'bpmn:Process') {
      return (
        <Collapse.Panel
          header={
            <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
              <SoundOutlined twoToneColor={colorPrimary} />
              &nbsp;消息与信号
            </Typography>
          }
          key={3}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <SignalMessage businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 表单 组件
   * 1、只有 UserTask 或 StartEvent 有
   */
  function renderElementForm() {
    if (
      element?.type === 'bpmn:UserTask' ||
      element?.type === 'bpmn:StartEvent'
    ) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
              <FileTextOutlined twoToneColor={colorPrimary} />
              &nbsp;表单
            </Typography>
          }
          key={4}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ElementForm businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 任务 组件
   * 1、所有 Task 类节点都有
   */
  function renderElementTask() {
    if (element?.type.indexOf('Task') !== -1) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
              <FireOutlined twoToneColor={colorPrimary} />
              &nbsp;{'任务'}
            </Typography>
          }
          key={5}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ElementTask businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 多实例 组件
   * 1、所有 Task 类节点都有
   */
  function renderMultiInstance() {
    if (element?.type.indexOf('Task') !== -1) {
      return (
        <Collapse.Panel
          header={
            <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
              <DeploymentUnitOutlined twoToneColor={colorPrimary} />
              &nbsp;多实例
            </Typography>
          }
          key={6}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <MultiInstance businessObject={businessObject} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 执行监听器 组件
   * 1、所有节点都有
   */
  function renderExecutionListener() {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <BellOutlined twoToneColor={colorPrimary} />
            &nbsp;执行监听器
          </Typography>
        }
        key={7}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementListener businessObject={businessObject} isTask={false} />
      </Collapse.Panel>
    );
  }

  /**
   * 渲染 任务监听器 组件
   * 1、只有 UserTask 才有
   */
  function renderTaskListener() {
    if (element?.type === 'bpmn:UserTask') {
      return (
        <Collapse.Panel
          header={
            <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
              <BellOutlined twoToneColor={colorPrimary} />
              &nbsp;任务监听器
            </Typography>
          }
          key={8}
          // style={{ backgroundColor: '#FFF' }}
          showArrow={true}
          forceRender={false}
        >
          <ElementListener businessObject={businessObject} isTask={true} />
        </Collapse.Panel>
      );
    }
  }

  /**
   * 渲染 扩展属性 组件
   * 1、所有节点都有
   */
  function renderExtensionProperties() {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <NodeIndexOutlined twoToneColor={colorPrimary} />
            &nbsp;扩展属性
          </Typography>
        }
        key={10}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ExtensionProperties businessObject={businessObject} />
      </Collapse.Panel>
    );
  }

  /**
   * 渲染 其它属性(元素文档) 组件
   * 1、所有节点都有
   */
  function renderElementOtherInfo() {
    return (
      <Collapse.Panel
        header={
          <Typography style={{ color: colorPrimary, fontWeight: 'bold' }}>
            <FileOutlined twoToneColor={colorPrimary} />
            &nbsp;元素文档
          </Typography>
        }
        key={11}
        // style={{ backgroundColor: '#FFF' }}
        showArrow={true}
        forceRender={false}
      >
        <ElementDocument businessObject={businessObject} />
      </Collapse.Panel>
    );
  }

  return (
    <>
      <Space
        direction="vertical"
        size={0}
        style={{ display: 'flex', width: '100%' }}
      >
        {/* 改为Tabs组件实现基本属性/高级属性切换 */}
        <Tabs
          defaultActiveKey="basic"
          // 关键修改：TabBar使用Flex布局，实现两端对齐
          tabBarStyle={{
            borderBottom: '1px solid #f0f0f0',
            display: 'flex', // 开启Flex布局
            justifyContent: 'space-between', // 两端对齐
            alignItems: 'center', // 垂直居中（可选，优化视觉）
            padding: '0 8px', // 可选：添加左右内边距，避免Tab贴边
            height: '62px',
          }}
          style={{ width: '100%' }}
        >
          {/* 基本属性Tab */}
          <TabPane
            tab={
              <Typography
                style={{
                  color: colorPrimary,
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                基本属性
              </Typography>
            }
            key="basic"
          >
            <Collapse
              bordered={false}
              expandIconPosition={'end'}
              accordion={false}
              defaultActiveKey={['base-info']}
              destroyInactivePanel={true}
              style={{ marginTop: 8 }}
            >
              {renderElementBaseInfo()}
              {renderSignalMessage()}
              {renderExecutionListener()}
              {renderFlowCondition()}
              {renderElementForm()}
              {renderElementTask()}
              {renderMultiInstance()}
              {renderTaskListener()}
            </Collapse>
          </TabPane>

          {/* 高级属性Tab */}
          <TabPane
            tab={
              <Typography
                style={{
                  color: colorPrimary,
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                高级属性
              </Typography>
            }
            key="advanced"
          >
            <Collapse
              bordered={false}
              expandIconPosition={'end'}
              accordion={false}
              destroyInactivePanel={true}
              style={{ marginTop: 8 }}
            >
              {renderExtensionProperties()}
              {renderElementOtherInfo()}
            </Collapse>
          </TabPane>
        </Tabs>
      </Space>
    </>
  );
}
