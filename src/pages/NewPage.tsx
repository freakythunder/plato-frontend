import React, { useState, useEffect, useRef } from "react";
import "/Users/somyabhadada/Desktop/somya-newpage-plato/plato-frontend/src/Styles/NewPage.css";
import { topics } from "../components/DummyData";

const NewPage = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [showChallenges, setShowChallenges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const storedLanguage = localStorage.getItem("language") || "JavaScript";

  let resumeChallenge = null;

  for (const topic of topics[0].topics) {
    if (topic.completed) continue;
    for (const subtopic of topic.subtopics) {
      if (subtopic.completed) continue;
      resumeChallenge = subtopic.challenges.find((challenge) => !challenge.completed);
      if (resumeChallenge) break;
    }
    if (resumeChallenge) break;
  }
  console.log(resumeChallenge);

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
                          <div key={challenge.id} className="challenge-container">
                            <div
                              className="challenge"
                              onClick={() => {
                                handleChallengeClick();
                                window.location.href = "/main";
                              }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                            >
                              {challenge.name}
                              {resumeChallenge && challenge.id === resumeChallenge.id && (
                                <button
                                  className="resume-button"
                                  style = {{backgroundColor: "green", color: "white", padding: "10px 10px", borderRadius: "10px",}}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = "/main";
                                  }}
                                >
                                  Resume
                                </button>
                              )}
                            </div>
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
      {resumeChallenge && (
        <button
          className="start-learning"
          onClick={() => {
            window.location.href = "/main";
          }}
        >
          Resume Learning
        </button>
      )}
    </div>
  );
};

export default NewPage;
