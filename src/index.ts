import colors from 'colors';
import 'dotenv/config';
import { createApp } from './app.ts';

const app = createApp();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(colors.blue(`🚀 Server is running at`), colors.green(`http://localhost:${port}`));
});
