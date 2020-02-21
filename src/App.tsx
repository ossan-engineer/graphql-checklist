import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

const GET_TODOS = gql`
  query getTodos {
    todos {
      done
      id
      text
    }
  }
`;
// list totos
// add todos
// toggle todos
// delete todos
function App() {
  const { loading, data, error } = useQuery(GET_TODOS);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error fetching todos!</div>;
  }

  return (
    <div>
      <h1>GraphQL Checklist</h1>
      <form>
        <input type='text' placeholder='Write your todo' />
        <button type='submit'>Create</button>
      </form>
      <div>
        {data.todos.map(({ id, text }: { id: string; text: string }) => (
          <p key={id}>
            <span>{text}</span>
            <button>&times;</button>
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
