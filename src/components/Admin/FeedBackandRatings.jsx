import React, { useEffect, useState } from 'react';
import { databases } from '../../appwrite/config';

// Helper for formatting date/time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const FeedBackandRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [errorRatings, setErrorRatings] = useState('');
  const [errorFeedbacks, setErrorFeedbacks] = useState('');

  // New: search/filter/sort state for ratings
  const [ratingsSearch, setRatingsSearch] = useState('');
  const [ratingsSortBy, setRatingsSortBy] = useState('createdAt');
  const [ratingsSortDir, setRatingsSortDir] = useState('desc');

  // New: search/filter/sort state for feedbacks
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackSortBy, setFeedbackSortBy] = useState('createdAt');
  const [feedbackSortDir, setFeedbackSortDir] = useState('desc');
  const [viewMessage, setViewMessage] = useState(null);
  const [viewRatingComment, setViewRatingComment] = useState(null);

  useEffect(() => {
    // Load ratings (from ratings collection)
    const loadRatings = async () => {
      setLoadingRatings(true);
      setErrorRatings('');
      try {
        const res = await databases.listDocuments(
          'cargo-car-rental',
          'ratings'
        );
        setRatings(res.documents);
      } catch (err) {
        setErrorRatings('Failed to load ratings');
      } finally {
        setLoadingRatings(false);
      }
    };
    // Load contact feedback (from feedback collection)
    const loadFeedbacks = async () => {
      setLoadingFeedbacks(true);
      setErrorFeedbacks('');
      try {
        const res = await databases.listDocuments(
          'cargo-car-rental',
          'feedback'
        );
        setFeedbacks(res.documents);
      } catch (err) {
        setErrorFeedbacks('Failed to load feedback');
      } finally {
        setLoadingFeedbacks(false);
      }
    };
    loadRatings();
    loadFeedbacks();
  }, []);

  // Filtered and sorted ratings
  const filteredRatings = ratings
    .filter(r => {
      const search = ratingsSearch.trim().toLowerCase();
      if (!search) return true;
      return (
        (r.userId && r.userId.toLowerCase().includes(search)) ||
        (r.vehicleId && r.vehicleId.toLowerCase().includes(search)) ||
        (r.comment && r.comment.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      let valA = a[ratingsSortBy] || '';
      let valB = b[ratingsSortBy] || '';
      if (ratingsSortBy === 'stars') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (ratingsSortBy === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }
      if (valA < valB) return ratingsSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return ratingsSortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // Filtered and sorted feedbacks
  const filteredFeedbacks = feedbacks
    .filter(fb => {
      const search = feedbackSearch.trim().toLowerCase();
      if (!search) return true;
      return (
        (fb.name && fb.name.toLowerCase().includes(search)) ||
        (fb.email && fb.email.toLowerCase().includes(search)) ||
        (fb.subject && fb.subject.toLowerCase().includes(search)) ||
        (fb.message && fb.message.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      let valA = a[feedbackSortBy] || '';
      let valB = b[feedbackSortBy] || '';
      if (feedbackSortBy === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }
      if (valA < valB) return feedbackSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return feedbackSortDir === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Feedback and Ratings</h2>
      <p className="text-gray-700 mb-6">
        Manage customer feedback and vehicle ratings to ensure quality service.
      </p>

      {/* Ratings Table */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-2">Vehicle Ratings</h3>
        {/* Search and sort controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by user, vehicle, or comment"
            value={ratingsSearch}
            onChange={e => setRatingsSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            style={{ minWidth: 200 }}
          />
          <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
            <label className="mr-2 text-sm text-gray-600">Sort by</label>
            <select
              value={ratingsSortBy}
              onChange={e => setRatingsSortBy(e.target.value)}
              className="text-sm bg-transparent outline-none"
            >
              <option value="createdAt">Date</option>
              <option value="stars">Rating</option>
              <option value="userId">User</option>
              <option value="vehicleId">Vehicle</option>
            </select>
            <button
              type="button"
              onClick={() => setRatingsSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
              className="ml-1 text-gray-500 hover:text-gray-700"
              title="Toggle sort direction"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className={ratingsSortDir === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'}>
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        {errorRatings && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {errorRatings}
          </div>
        )}
        {loadingRatings ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading ratings...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b text-left">User</th>
                  <th className="px-4 py-2 border-b text-left">Vehicle</th>
                  <th className="px-4 py-2 border-b text-left">Rating</th>
                  <th className="px-4 py-2 border-b text-left">Comment</th>
                  <th className="px-4 py-2 border-b text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRatings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No ratings found.
                    </td>
                  </tr>
                ) : (
                  filteredRatings.map((r) => (
                    <tr key={r.$id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b">
                        <div className="font-medium">{r.userId}</div>
                      </td>
                      <td className="px-4 py-2 border-b">
                        {r.vehicleId}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {r.stars !== undefined ? (
                          <span className="font-semibold text-yellow-600">{r.stars} / 5</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {r.comment ? (
                          <button
                            className="text-blue-600 underline hover:text-blue-800 text-sm"
                            onClick={() => setViewRatingComment(r)}
                          >
                            View Comment
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {formatDateTime(r.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Feedback Table */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Contact Feedback</h3>
        {/* Search and sort controls */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by name, email, subject, or message"
            value={feedbackSearch}
            onChange={e => setFeedbackSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            style={{ minWidth: 200 }}
          />
          <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
            <label className="mr-2 text-sm text-gray-600">Sort by</label>
            <select
              value={feedbackSortBy}
              onChange={e => setFeedbackSortBy(e.target.value)}
              className="text-sm bg-transparent outline-none"
            >
              <option value="createdAt">Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="subject">Subject</option>
            </select>
            <button
              type="button"
              onClick={() => setFeedbackSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
              className="ml-1 text-gray-500 hover:text-gray-700"
              title="Toggle sort direction"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className={feedbackSortDir === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'}>
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        {errorFeedbacks && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {errorFeedbacks}
          </div>
        )}
        {loadingFeedbacks ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading feedback...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b text-left">Name</th>
                  <th className="px-4 py-2 border-b text-left">Email</th>
                  <th className="px-4 py-2 border-b text-left">Subject</th>
                  <th className="px-4 py-2 border-b text-left">Message</th>
                  <th className="px-4 py-2 border-b text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No feedback found.
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((fb) => (
                    <tr key={fb.$id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b">{fb.name}</td>
                      <td className="px-4 py-2 border-b">{fb.email}</td>
                      <td className="px-4 py-2 border-b">{fb.subject}</td>
                      <td className="px-4 py-2 border-b">
                        <button
                          className="text-blue-600 underline hover:text-blue-800 text-sm"
                          onClick={() => setViewMessage(fb)}
                        >
                          View Message
                        </button>
                      </td>
                      <td className="px-4 py-2 border-b">{formatDateTime(fb.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Rating Comment Modal */}
      {viewRatingComment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-800">Rating Comment</h4>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => setViewRatingComment(null)}
                title="Close"
              >
                &times;
              </button>
            </div>
            <div className="mb-2">
              <span className="font-semibold">User:</span> {viewRatingComment.userId}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Vehicle:</span> {viewRatingComment.vehicleId}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Rating:</span> {viewRatingComment.stars} / 5
            </div>
            <div className="mb-2">
              <span className="font-semibold">Date:</span> {formatDateTime(viewRatingComment.createdAt)}
            </div>
            <div className="bg-gray-50 border rounded p-4 whitespace-pre-line break-words max-h-60 overflow-y-auto">
              {viewRatingComment.comment}
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setViewRatingComment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Message Modal */}
      {viewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-800">Feedback Message</h4>
              <button
                className="text-gray-400 hover:text-gray-600 text-xl"
                onClick={() => setViewMessage(null)}
                title="Close"
              >
                &times;
              </button>
            </div>
            <div className="mb-2">
              <span className="font-semibold">From:</span> {viewMessage.name} ({viewMessage.email})
            </div>
            <div className="mb-2">
              <span className="font-semibold">Subject:</span> {viewMessage.subject}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Date:</span> {formatDateTime(viewMessage.createdAt)}
            </div>
            <div className="bg-gray-50 border rounded p-4 whitespace-pre-line break-words max-h-60 overflow-y-auto">
              {viewMessage.message}
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setViewMessage(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedBackandRatings;