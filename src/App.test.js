import { createRoot } from 'react-dom/client';
import App from './App';

it('renders without crashing', () => {
  const div = document.createElement('div'),
        root = createRoot(div),
        mockDataSource = {};
  root.render(<App dataSource={mockDataSource}/>);
});
