import React from 'react'

export default function pagination({pagination,onPageChange}) {
    const {currentPage, totalPage} = pagination;
  return (
    <div>
        <span>Page{currentPage} of{totalPage || 1} </span>
            <div>
                <button disabled={currentPage<=1} onClick={()=>onPageChange(currentPage - 1)}>previous</button>
                <button disabled={currentPage >= totalPage} onClick={()=>onPageChange(currentPage + 1)}>next</button>
            </div>
    </div>
  )
}
