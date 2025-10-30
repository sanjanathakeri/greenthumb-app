import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { forumPosts } from '@/utils/dummyData';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Forum = () => {
  const { t } = useTranslation();
  const [newQuestion, setNewQuestion] = useState('');

  const handlePostQuestion = () => {
    console.log('Posting question:', newQuestion);
    setNewQuestion('');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('forum.title')}</h1>
        <p className="text-muted-foreground">Connect with farmers and experts</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('forum.askQuestion')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="min-h-32"
            />
            <Button onClick={handlePostQuestion} className="w-full md:w-auto">
              <Send className="h-4 w-4 mr-2" />
              {t('forum.post')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('forum.recentPosts')}</h2>
        {forumPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-primary p-2 rounded-lg">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{post.author}</span>
                        <Badge variant="secondary" className="text-xs">
                          {post.role}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Clock className="h-3 w-3" />
                          <span>{post.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-foreground mb-3">{post.question}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {post.replies} {t('forum.reply')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {post.answers.map((answer) => (
                    <motion.div
                      key={answer.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="ml-12 pl-4 border-l-2 border-accent"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-accent p-2 rounded-lg">
                          <User className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{answer.author}</span>
                            <Badge variant="default" className="text-xs">
                              {answer.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {answer.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{answer.answer}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Forum;
