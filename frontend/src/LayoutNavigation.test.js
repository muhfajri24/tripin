import React from 'react';
import {createRoot} from 'react-dom/client';
import {act} from 'react';
import {MemoryRouter, Routes, Route, Link} from 'react-router-dom';
import {Simulate} from 'react-dom/test-utils';
import AppLayout from './layouts/AppLayout';

test('route navigation resets the actual scroll container', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}} initialEntries={['/create']}>
      <Routes><Route element={<AppLayout/>}><Route path='/create' element={<Link to='/my-itineraries'>Next</Link>}/><Route path='/my-itineraries' element={<p>Saved</p>}/></Route></Routes>
    </MemoryRouter>));
    const main = container.querySelector('main');
    main.scrollTop = 500;
    await act(async () => Simulate.click([...container.querySelectorAll('a')].find(x => x.textContent === 'Next'), {button:0}));
    expect(main.scrollTop).toBe(0);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
