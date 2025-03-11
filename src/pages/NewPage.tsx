import React, { useState, useEffect, useRef } from "react";
import "/Users/somyabhadada/Desktop/somya-newpage-plato/plato-frontend/src/Styles/NewPage.css";

const NewPage = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [showChallenges, setShowChallenges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const storedLanguage = localStorage.getItem("language") || "JavaScript";

  const topics = [
    {
      language: "JavaScript",
      topics: [
        {
          id: 1,
          name: "JavaScript Basics",
          description: "Introduction to JavaScript syntax and fundamental concepts.",
          completed: false,
          subtopics: [
            {
              id: "1.1",
              name: "Variables and Data Types",
              description: "Understanding var, let, const, and different data types.",
              completed: false,
              challenges: [
                {
                  id: "1.1.1",
                  name: "Declare Variables Challenge",
                  completed: false,
                  attempts: [0],
                  description: "Write a script that declares and initializes variables of all JavaScript data types.",
                },
                {
                  id: "1.1.2",
                  name: "Data Type Conversion",
                  completed: false,
                  attempts: [0],
                  description: "Convert values between different data types and predict outputs.",
                },
                {
                  id: "1.1.3",
                  name: "Scope Analysis",
                  completed: false,
                  attempts: [0],
                  description: "Determine the scope of variables in different functions and blocks.",
                },
              ],
            },
            {
              id: "1.2",
              name: "Functions and Scope",
              description: "Understanding function declarations, expressions, and scope.",
              completed: false,
              challenges: [
                {
                  id: "1.2.1",
                  name: "Scope Practice Challenge",
                  completed: false,
                  attempts: [0],
                  description: "Fix the function to properly utilize local and global scope.",
                },
                {
                  id: "1.2.2",
                  name: "Arrow Function Rewrite",
                  completed: false,
                  attempts: [0],
                  description: "Convert regular functions to ES6 arrow functions.",
                },
                {
                  id: "1.2.3",
                  name: "Closures in Practice",
                  completed: false,
                  attempts: [0],
                  description: "Create a function that demonstrates closure behavior.",
                },
              ],
            },
          ],
        },
        {
          id: 2,
          name: "Asynchronous JavaScript",
          description: "Learn about asynchronous programming in JavaScript.",
          completed: false,
          subtopics: [
            {
              id: "2.1",
              name: "Promises & Async/Await",
              description: "Understanding how promises and async/await work.",
              completed: false,
              challenges: [
                {
                  id: "2.1.1",
                  name: "Fetch API Challenge",
                  completed: false,
                  attempts: [0],
                  description: "Use the Fetch API to retrieve data from a public API asynchronously.",
                },
                {
                  id: "2.1.2",
                  name: "Promise Chain",
                  completed: false,
                  attempts: [0],
                  description: "Chain multiple promises to handle sequential asynchronous operations.",
                },
                {
                  id: "2.1.3",
                  name: "Async/Await Error Handling",
                  completed: false,
                  attempts: [0],
                  description: "Modify an async function to include proper error handling.",
                },
              ],
            },
            {
              id: "2.2",
              name: "Event Loop & Callbacks",
              description: "Deep dive into JavaScript’s event loop and callback functions.",
              completed: false,
              challenges: [
                {
                  id: "2.2.1",
                  name: "Callback Queue Debugging",
                  completed: false,
                  attempts: [0],
                  description: "Analyze the execution order of setTimeout, promises, and synchronous code.",
                },
                {
                  id: "2.2.2",
                  name: "Callback Pyramid Fix",
                  completed: false,
                  attempts: [0],
                  description: "Refactor deeply nested callbacks into a cleaner structure.",
                },
                {
                  id: "2.2.3",
                  name: "Microtasks vs Macrotasks",
                  completed: false,
                  attempts: [0],
                  description: "Identify and explain execution order of different tasks in JavaScript.",
                },
              ],
            },
          ],
        },
        {
          id: 3,
          name: "Object-Oriented JavaScript",
          description: "Learn about objects, prototypes, and classes in JavaScript.",
          completed: false,
          subtopics: [
            {
              id: "3.1",
              name: "Prototypes and Inheritance",
              description: "Understanding JavaScript prototype chaining and inheritance.",
              completed: false,
              challenges: [
                {
                  id: "3.1.1",
                  name: "Prototype Chain Challenge",
                  completed: false,
                  attempts: [0],
                  description: "Create a prototype chain demonstrating inheritance.",
                },
                {
                  id: "3.1.2",
                  name: "Prototype vs Class",
                  completed: false,
                  attempts: [0],
                  description: "Compare prototype-based and class-based inheritance.",
                },
                {
                  id: "3.1.3",
                  name: "Custom Prototype Method",
                  completed: false,
                  attempts: [0],
                  description: "Create a custom method using JavaScript prototype.",
                },
              ],
            },
            {
              id: "3.2",
              name: "Classes and Objects",
              description: "Understanding ES6 classes and object-oriented programming.",
              completed: false,
              challenges: [
                {
                  id: "3.2.1",
                  name: "Class Creation Challenge",
                  completed: false,
                  attempts: [0],
                  description: "Create a class representing a Book with methods for borrowing and returning.",
                },
                {
                  id: "3.2.2",
                  name: "Inheritance with Classes",
                  completed: false,
                  attempts: [0],
                  description: "Extend a base class and add additional properties/methods.",
                },
                {
                  id: "3.2.3",
                  name: "Encapsulation with Private Fields",
                  completed: false,
                  attempts: [0],
                  description: "Implement private fields in a class and control access.",
                },
              ],
            },
          ],
        },
        {
          id: 4,
          name: "DOM Manipulation",
          description: "Understanding how to interact with the Document Object Model (DOM).",
          completed: false,
          subtopics: [
            {
              id: "4.1",
              name: "Selecting and Modifying Elements",
              description: "Learn how to manipulate DOM elements using JavaScript.",
              completed: false,
              challenges: [
                {
                  id: "4.1.1",
                  name: "DOM Selector Challenge",
                  completed: false,
                  attempts: [0],
                  description: "Select elements using querySelector and modify their content.",
                },
                {
                  id: "4.1.2",
                  name: "Event Listener Implementation",
                  completed: false,
                  attempts: [0],
                  description: "Add and remove event listeners dynamically.",
                },
                {
                  id: "4.1.3",
                  name: "DOM Traversal Practice",
                  completed: false,
                  attempts: [0],
                  description: "Navigate between parent, child, and sibling elements.",
                },
              ],
            },
          ],
        },
        {
          id: 5,
          name: "Error Handling & Debugging",
          description: "Techniques for handling errors and debugging JavaScript code.",
          completed: false,
          subtopics: [
            {
              id: "5.1",
              name: "Try-Catch and Error Objects",
              description: "Learn how to handle errors gracefully in JavaScript.",
              completed: false,
              challenges: [
                {
                  id: "5.1.1",
                  name: "Basic Try-Catch",
                  completed: false,
                  attempts: [0],
                  description: "Wrap code in try-catch and handle errors properly.",
                },
                {
                  id: "5.1.2",
                  name: "Custom Error Class",
                  completed: false,
                  attempts: [0],
                  description: "Create a custom error class and use it in exception handling.",
                },
                {
                  id: "5.1.3",
                  name: "Debugging Using Console",
                  completed: false,
                  attempts: [0],
                  description: "Use console.log and breakpoints to debug errors.",
                },
              ],
            },
          ],
        },
      ],
    },
  ];
 
  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedSubtopic(null);
    setShowChallenges(false);
  };

  const handleSubtopicClick = (subtopicId: string) => {
    setSelectedSubtopic(subtopicId);
    setShowChallenges(false);
  };

  const handleChallengeClick = () => {
    setShowChallenges(true);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setSelectedTopic(null);
      setSelectedSubtopic(null);
      setShowChallenges(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="container">
      <h1 className="title">
        Here's the course on {storedLanguage} generated for you...
      </h1>
      <div id="topics-container" className="topics-container">
        {topics[0].topics.map((topic) => (
          <div key={topic.id} className="topic">
            <div
              className="topic-title"
              onClick={() => handleTopicClick(topic.id.toString())}
            >
              {topic.name}
            </div>
            {selectedTopic === topic.id.toString() && (
              <div className="subtopics-container">
                {topic.subtopics.map((subtopic) => (
                  <div key={subtopic.id} className="subtopic">
                    <div
                      className="subtopic-title"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubtopicClick(subtopic.id);
                      }}
                    >
                      {subtopic.name}
                    </div>
                    {selectedSubtopic === subtopic.id && (
                      <div className="challenges-container">
                        {subtopic.challenges.map((challenge) => (
                          <div
                            key={challenge.id}
                            className="challenge"
                            onClick={() => {
                              handleChallengeClick();
                              window.location.href = "/main";
                            }}
                          >
                            {challenge.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {(selectedTopic || selectedSubtopic || showChallenges) && (
        <button className="start-learning">Start Learning...</button>
      )}
    </div>
  );
};

export default NewPage;
