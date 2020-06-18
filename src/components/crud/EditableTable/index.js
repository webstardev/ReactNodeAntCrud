import React, { useState, useEffect, useContext } from 'react';
import { Table, Popconfirm, Form } from 'antd';
import EditableCell from './EditableCell';
import RequestHelper from '../../../utils/RequestUtils';
import './styles.css';

import { AppContext } from '../../../context/AppContext';
import * as ACTION_TYPE from '../../../reducers/actionType';

const EditableTable = () => {
  const { state, dispatch } = useContext(AppContext);

  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record) => record.key === editingKey;

  useEffect(() => {
    RequestHelper.get('/user/all')
      .then((res) => {
        dispatch({
          type: ACTION_TYPE.GET_USER_LISTS,
          payload: res.data.users,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, [dispatch]);

  useEffect(() => {
    setData([
      ...state.users.users.map((item, nIndex) => {
        return {
          ...item,
        };
      }),
    ]);
  }, [state.users]);

  const edit = (record) => {
    form.setFieldsValue({
      name: '',
      age: '',
      address: '',
      ...record,
    });
    setEditingKey(record.key);
  };

  const cancelEdit = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setData(newData);

        RequestHelper.put(`/user/${item.id}`, { ...row })
          .then((res) => {
            dispatch({
              type: ACTION_TYPE.UPDATE_USER,
              payload: {
                key: key,
                ...res.data.user,
              },
            });
          })
          .catch((err) => {
            console.log(err);
          });
        setEditingKey('');
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const deleteUser = async (key) => {
    RequestHelper.delete(`/user/${key}`)
      .then((res) => {
        if (res.data.success)
          dispatch({
            type: ACTION_TYPE.DELETE_USER,
            payload: key,
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const columns = [
    {
      title: 'Id',
      dataIndex: 'id',
      width: '40px',
      editable: false,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      width: '25%',
      editable: true,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      width: '15%',
      editable: true,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      width: '40%',
      editable: true,
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <a
              onClick={() => save(record.key)}
              style={{
                marginRight: 8,
              }}
            >
              Save
            </a>
            <Popconfirm title="Sure to cancel?" onConfirm={cancelEdit}>
              <a>Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <span>
            <a disabled={editingKey !== ''} onClick={() => edit(record)}>
              Edit
            </a>
            <Popconfirm
              title="Are you sure？"
              okText="Yes"
              cancelText="No"
              onConfirm={() => {
                deleteUser(record.key);
              }}
            >
              <a>Delete</a>
            </Popconfirm>
            ,
          </span>
        );
      },
    },
  ];
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'age' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });
  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: cancelEdit,
        }}
      />
    </Form>
  );
};

export default EditableTable;
