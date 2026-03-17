import { Route, Switch, Redirect } from 'wouter';
import Layout from './layout/Layout';
import TrackingDashboard from './routes/tracking';
import StudyDashboard from './routes/study';
import KnowledgeBase from './routes/knowledge';
import Settings from './routes/settings';

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/tracking" component={TrackingDashboard} />
        <Route path="/study" component={StudyDashboard} />
        <Route path="/knowledge" component={KnowledgeBase} />
        <Route path="/settings" component={Settings} />
        <Route path="/">
          <Redirect to="/tracking" />
        </Route>
      </Switch>
    </Layout>
  );
}
