// import React from 'react';
import Typeahead from './components/Typeahead';

function App() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Typeahead name='fruit' placeholder='Type to search...' />
    </div>
  );
}

export default App;
