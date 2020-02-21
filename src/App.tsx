import React, { useState, SyntheticEvent } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import styled from 'styled-components';

type Data = {
  todos?: Todo[];
};

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

const GET_TODOS = gql`
  query getTodos {
    todos {
      done
      id
      text
    }
  }
`;

const TOGGLE_TODO = gql`
  mutation ToggleTodo($id: uuid!, $done: Boolean!) {
    update_todos(where: { id: { _eq: $id } }, _set: { done: $done }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

const ADD_TODO = gql`
  mutation MyMutation($text: String) {
    insert_todos(objects: { text: $text }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

const DELETE_TODO = gql`
  mutation DeleteTodo($id: uuid) {
    delete_todos(where: { id: { _eq: $id } }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

// list totos
// add todos
// toggle todos
// delete todos
function App() {
  const [text, setText] = useState('');
  const { loading, data, error } = useQuery(GET_TODOS);
  const [toggleTodo] = useMutation(TOGGLE_TODO);
  const [addTodo] = useMutation(ADD_TODO, {
    onCompleted: () => setText('')
  });
  const [deleteTodo] = useMutation(DELETE_TODO);

  const handleToggleTodo = async (id: string, done: boolean) => {
    const data = await toggleTodo({ variables: { id, done: !done } });
    console.log('toggled todo', data);
  };

  const handleAddTodo = async (e: SyntheticEvent, text: string) => {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }
    const data = await addTodo({
      variables: { text },
      refetchQueries: [
        {
          query: GET_TODOS
        }
      ]
    });
    console.log('added todo', data);
  };

  const handleDeleteTodo = async (id: string): Promise<void> => {
    const isConfirmed = window.confirm('Do you want to delete this todo?');

    if (isConfirmed) {
      const data = await deleteTodo({
        variables: { id },
        // refetchQueries: [
        //   {
        //     query: GET_TODOS
        //   }
        // ]
        update: cache => {
          const prevData: Data | null = cache.readQuery({ query: GET_TODOS });
          const newTodos =
            prevData && prevData.todos
              ? prevData.todos.filter(todo => todo.id !== id)
              : null;
          cache.writeQuery({ query: GET_TODOS, data: { todos: newTodos } });
        }
      });
      console.log('deleted todo', data);
    }

    // const data = console.log('deleted todo', data);
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error fetching todos!</div>;
  }

  return (
    <div>
      <h1>GraphQL Checklist</h1>
      <form onSubmit={e => handleAddTodo(e, text)}>
        <input
          type='text'
          placeholder='Write your todo'
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type='submit'>Create</button>
      </form>
      <div>
        {data.todos.map(
          ({ id, text, done }: { id: string; text: string; done: boolean }) => (
            <Text
              key={id}
              done={done}
              onDoubleClick={() => handleToggleTodo(id, done)}
            >
              <span>{text}</span>
              <button onClick={() => handleDeleteTodo(id)}>&times;</button>
            </Text>
          )
        )}
      </div>
    </div>
  );
}

const Text = styled.p`
  text-decoration: ${({ done }: { done: boolean }) =>
    done ? 'line-through' : 'none'};
`;

export default App;
