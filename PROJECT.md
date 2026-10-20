# AI Learning Companion

**Learn by doing. Remember by solving. Improve through conversation.**

## The Idea

An AI-powered learning companion that transforms learning sessions into an evolving knowledge base and uses that knowledge to challenge you with practical problems.

**It is not a note-taking app or another AI tutor. It helps you retain and apply what you have learned.**

Imagine spending an evening learning neural networks, implementing algorithms, and discussing concepts with an AI tutor. The next morning, on the train, you open the companion. Instead of rereading notes, it presents a problem:

> You've implemented a neural network, but after several training iterations, its predictions barely change. What could be wrong? How would you investigate?

You explain your reasoning. The AI challenges assumptions, provides additional information, and guides you toward a solution without immediately giving it away. Over time, it develops a better picture of what you understand, struggle with, and may have forgotten.

## How It Works

1. **Learn with your existing tutor.** Study theory, experiment, write code, and ask questions, using *AI Engineering from Scratch* as an initial reference.
2. **Synchronize through MCP.** The tutor sends a structured summary of concepts covered, explanations, mistakes, questions, and demonstrated progress.
3. **Build your knowledge profile.** The app extracts concepts, discoveries, gaps, and uncertainties, maintaining a history of how your understanding evolves.
4. **Challenge yourself anywhere.** During a commute, solve reasoning problems through interactive conversations.
5. **Feed insights back.** The recap results update your profile, which the tutor can consult in future learning sessions.

## Core Experience

### 1. Evolving Knowledge Base

- Automatically receive learning summaries through MCP.
- Track concepts studied, demonstrated understanding, mistakes, and unanswered questions.
- Distinguish **what was covered** from **what the learner has actually demonstrated**.
- Automatically process summaries while flagging uncertain conclusions or possible misconceptions for review.
- Preserve the original learning history so progress and changes in understanding remain visible.

### 2. Challenges Instead of Passive Reading

Generate problems based on the learner's knowledge, such as:

- Mentally debugging an algorithm.
- Predicting what happens when a parameter changes.
- Identifying an incorrect assumption.
- Reasoning through a real-world scenario.
- Connecting concepts learned in different sessions.

Challenges should work without a computer or coding environment, particularly during a train commute.

### 3. An AI That Challenges Thinking

- Ask follow-up questions rather than immediately revealing answers.
- Introduce new constraints or evidence to test reasoning.
- Encourage the learner to explain and defend conclusions.
- Offer hints when requested or when the learner is genuinely stuck.
- Allow explanations or skipping rather than forcing repeated attempts.
- Evaluate reasoning and identify possible gaps, not just mark answers right or wrong.

### 4. Continuous Learning and Relearning

- Use review performance to identify concepts needing reinforcement.
- Revisit material over time rather than relying on one-off quizzes.
- Make it possible to return to an old topic without starting from scratch.
- Let each recap conversation contribute new evidence to the learning profile.

## A Typical Day

### Evening — Learn

Spend 40 minutes studying backpropagation with an existing AI tutor. Write code, make mistakes, and work through the chain rule. The tutor sends a structured session summary through MCP.

### Morning — Challenge

On the train, open the app and receive a short debugging scenario about a neural network. Reason through the problem, request hints if needed, and uncover a gap in understanding.

### Next Session — Improve

The tutor consults the updated learning profile through MCP. It sees where the learner struggled and can reinforce those concepts in the next practical exercise.

## How It Differs From Traditional Learning Tools

| Traditional tools | AI Learning Companion |
| --- | --- |
| Store notes | Builds an evolving knowledge profile |
| Ask users to memorize facts | Challenges them to reason through problems |
| Provide fixed quizzes | Generates contextual, adaptive scenarios |
| Mark answers correct or incorrect | Evaluates reasoning and identifies gaps |
| Separate studying from reviewing | Connects tutors, learning sessions, and recaps |
| Encourage rereading | Encourages reconstructing knowledge through practice |

## Initial Product (MVP)

Focus on four capabilities:

1. **MCP integration:** Receive structured summaries from the existing tutor.
2. **Knowledge base:** Store concepts, learning history, demonstrated understanding, mistakes, and unresolved questions.
3. **Challenge engine:** Generate reasoning-based problems and conduct interactive discussions.
4. **Learning feedback:** Update the knowledge profile after each challenge while preserving uncertainty.

### Minimal Interface

- A mobile-friendly conversation screen.
- A simple history of learned concepts and sessions.
- A **Start Challenge** action.
- A lightweight way to review or correct uncertain conclusions.

### Out of Scope for the MVP

- Complex dashboards.
- Gamification and streaks.
- Visual knowledge graphs.
- Custom course-building tools.
- Full code execution environments.

*AI Engineering from Scratch* is the initial curriculum reference, but the product should not depend on one course. Other tutors or learning systems should eventually be able to contribute through the same integration model.

## Long-Term Vision

After a year of learning AI engineering, the companion contains a history of concepts encountered, mistakes made, problems solved, and changes in understanding.

The learner can ask:

> Challenge me on something I learned three months ago.

> Give me a problem that combines linear algebra, gradient descent, and neural networks.

> What do I keep getting wrong about backpropagation?

The system answers using the learner's own history instead of treating each conversation as a fresh start.

## Product Principle

**Turn everything you learn into something you can actively use, not just something you read once.**

The result is a persistent learning companion that grows with your knowledge, challenges your reasoning, and helps turn understanding into lasting skill.
