const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /import \{ Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title \} from 'chart\.js';/,
  "import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';"
);

content = content.replace(
  /import \{ Pie, Bar \} from 'react-chartjs-2';/,
  "import { Pie, Bar, Line } from 'react-chartjs-2';"
);

content = content.replace(
  /ChartJS\.register\(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title\);/,
  "ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement);"
);

fs.writeFileSync(file, content, 'utf8');
console.log('ChartJS imports updated for Line chart');
