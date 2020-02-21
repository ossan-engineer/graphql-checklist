import React, { useState, SyntheticEvent } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';

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

    // const data = console.log('deleted todo', data);
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error fetching todos!</div>;
  }

  return (
    <>
      <AppBar position='static'>
        <Toolbar>
          <Typography variant='h6'>GraphQL Checklist</Typography>
        </Toolbar>
      </AppBar>
      <StyledForm onSubmit={e => handleAddTodo(e, text)}>
        <TextField
          placeholder='Write your todo'
          value={text}
          onChange={e => setText(e.target.value)}
          fullWidth
        />
        <Button type='submit' variant='outlined' color='primary'>
          Create
        </Button>
      </StyledForm>
      <List>
        {data.todos.map(
          ({ id, text, done }: { id: string; text: string; done: boolean }) => (
            <ListItem
              key={id}
              dense
              button
              onClick={() => handleToggleTodo(id, done)}
            >
              <ListItemIcon>
                <Checkbox
                  color='primary'
                  checked={done}
                  inputProps={{ 'aria-labelledby': id }}
                />
              </ListItemIcon>
              <ListItemText id={id}>
                <Text done={done}>{text}</Text>
              </ListItemText>
              <ListItemSecondaryAction>
                <IconButton onClick={() => handleDeleteTodo(id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          )
        )}
      </List>
    </>
  );
}

const StyledForm = styled.form`
  display: flex;
  padding: 30px 30px 20px;

  & > div:first-child {
    margin-right: 20px;
  }
`;

const Text = styled.p`
  text-decoration: ${({ done }: { done: boolean }) =>
    done ? 'line-through' : 'none'};
`;

export default App;
